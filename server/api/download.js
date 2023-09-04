import { Router } from "express"; const router = Router();
import { db, getFilePath, getContent, getAllowed } from "../helpers/database.js";
import { isJpg, isHeic, isVideo, getSmallJpg, jpg } from "../helpers/media.js";
import { customAlphabet } from "nanoid";
import { parse } from "path";
import archiver from "archiver";
import { createReadStream } from "fs";

router.post("/options", async (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }

    try {
        let options = [];
        if(req.body.file) {
            let file = db.prepare("SELECT * FROM files WHERE id = ?").get(req.body.file);
            if(!file) { res.sendStatus(404); return; }

            let allowed = getAllowed(file.id, true);
            if(!req.session.admin && !allowed.users.includes(req.session.user) && !allowed.shares.includes(req.session.share)) { res.sendStatus(403); return; }

            options.push({desc: "original", name: file.name, url: `file/${file.id}`});
            if(isHeic(file.name)) options.push({desc: "JPEG", name: parse(file.name).name+".jpg", url: `file/${file.id}/jpg`});
            if(!isVideo(file.name)) options.push({desc: "JPEG, smaller filesize", name: parse(file.name).name + "_small.jpg", url: `file/${file.id}/small`});
        } else {
            let files = [];
            if(req.body.files) files = req.body.files;
            else if(req.body.folder) files = getContent(req.body.folder).files;
            else if(req.body.share) files = getContent(db.prepare("SELECT folder_id FROM shares WHERE id = ?").pluck().get(req.body.share)).files;

            if(files.length < 1) { res.sendStatus(404); return; }

            files = files.filter(e => {
                let allowed = getAllowed(e, true);
                return allowed.users.includes(req.session.user) || allowed.shares.includes(req.session.share);
            });

            if(files.length < 1) { res.sendStatus(403); return; }

            let encoded = encodeURIComponent(JSON.stringify(files.sort((a, b) => a - b)));
            let url = db.prepare("SELECT url FROM zips WHERE content = ?").pluck().get(encoded);
            if(!url) {
                url = (function random() {
                    let rnd = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8)();
                    if(db.prepare("SELECT * FROM zips WHERE url = ?").pluck().get(rnd)) return random();
                    else return rnd;
                })();
                db.prepare("INSERT INTO zips (url, content) VALUES (?,?)").run(url, encoded);
            }

            let name = (req.body.name ? req.body.name.replaceAll(" ", "_") : "");

            options.push
            let heic = false, image = false;
            for(let f of files) {
                let file = db.prepare("SELECT * FROM files WHERE id = ?").get(f);
                if(!heic && isHeic(file.name)) { heic = true; image = true; }
                else if(!image && (isJpg(file.name))) image = true;
                if(image && heic) break;
            }

            options = [
                {desc: "original", name: name+".zip", url: `zip/${url}/-/${encodeURIComponent(name)}`},
                ... heic ? [{desc: "HEICs converted to JPEG", name: name+"_jpg.zip", url: `zip/${url}/jpg/${encodeURIComponent(name+"_jpg")}`}] : [],
                ... image ? [{desc: "images with smaller filesize", name: name+"_small.zip", url: `zip/${url}/small/${encodeURIComponent(name+"_small")}`}] : []
            ]
        }
        res.json(options);
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.get("/file/:id/:option?", async (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }

    try {
        let file = db.prepare("SELECT * FROM files WHERE id = ?").get(req.params.id);
        if(!file) { res.sendStatus(404); return; }

        let allowed = getAllowed(file.id, true);
        if(!req.session.admin && !allowed.users.includes(req.session.user) && !allowed.shares.includes(req.session.share)) { res.sendStatus(403); return; }

        let filepath = getFilePath(file.id, true);

        if(!req.params.option) { // send original file
            res.download(filepath, file.name);
            return;
        } else {
            filepath = await jpg(file.id);
            if(req.params.option == "jpg") res.download(filepath, parse(file.name).name+".jpg");
            else if(req.params.option == "small") {
                filepath = await getSmallJpg(file.id);
                res.download(filepath, parse(file.name).name+"_small.jpg");
            }
        }
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.get("/zip/:url/:option?/:name?", async (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }
    if(req.params.option && req.params.option != "jpg" && req.params.option != "small" && req.params.option != "-") { res.sendStatus(400); return; }

    try {
        let files = db.prepare("SELECT content FROM zips WHERE url = ?").pluck().get(req.params.url);
        if(!files) { res.sendStatus(404); return; }

        files = JSON.parse(decodeURIComponent(files));

        files = files.filter(e => {
            let allowed = getAllowed(e, true);
            return allowed.users.includes(req.session.user) || allowed.shares.includes(req.session.share);
        });

        if(files.length < 1) { res.sendStatus(403); return; }

        let archive = archiver("zip");

        archive.on("end", () => console.log("archive finalized: "+(Math.round(archive.pointer() / (1024 * 1024) * 100) / 100) + " MB total"))
        archive.on("error", (err) => console.log(err))

        let name = decodeURIComponent(req.params.name).replaceAll(" ", "_");
        res.attachment(name+".zip", {zlib: {level: 9}});
    
        archive.pipe(res);

        let connClosed = false;
        req.on("close", () => { connClosed = true; })
    
        for (let f of files) {
            if(connClosed) break;
            let file = db.prepare("SELECT * FROM files WHERE id = ?").get(f);
            let filepath = getFilePath(f, true);
            if(!["jpg", "small"].includes(req.params.option) || isVideo(filepath)) archive.append(createReadStream(filepath), {name: file.name});
            else {
                filepath = await jpg(f);
                if(req.params.option == "jpg") archive.append(createReadStream(filepath), { name: parse(file.name).name+".jpg" });
                else if(req.params.option == "small") {
                    filepath = await getSmallJpg(file.id);
                    archive.append(createReadStream(filepath), { name: parse(file.name).name+"_small.jpg" });
                }
            }
        }

        if(connClosed) archive.abort(); else archive.finalize();
    } catch(err) { console.log(err); }
})

export default router;