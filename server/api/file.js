import { Router } from "express"; const router = Router();
import { statSync, createReadStream } from "fs";
import { db, getFilePath, getOwner, getAllowed } from "../helpers/database.js"
import { getPreview } from "../helpers/media.js"

router.get("/info/:id", (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }
    try {
        let allowed = getAllowed(req.params.id, true);
        if(!req.session.admin && !allowed.users.includes(req.session.user) && !allowed.shares.includes(req.session.share)) { res.sendStatus(403); return; }

        res.json(db.prepare("SELECT * FROM files LEFT JOIN metadata ON files.id = metadata.file_id WHERE files.id = ?").get(req.params.id));
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.get("/path/:id", (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }
    try {
        if(req.session.user != getOwner(req.params.id, true)) { res.sendStatus(403); return; }
        res.send(getFilePath(req.params.id));
    } catch(err) { res.sendStatus(500); }
})

router.get("/preview/:id/:size", async (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }
    try {
        let allowed = getAllowed(req.params.id, true);
        if(!req.session.admin && !allowed.users.includes(req.session.user) && !allowed.shares.includes(req.session.share)) { res.sendStatus(403); return; }

        let size = Number(req.params.size);
        res.sendFile(await getPreview(req.params.id, !isNaN(size) ? size : false));
    } catch(err) { console.log(err); res.statusCode(500); }
})

router.get("/stream/:id", async (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }
    try {
        let allowed = getAllowed(req.params.id, true);
        if(!req.session.admin && !allowed.users.includes(req.session.user) && !allowed.shares.includes(req.session.share)) { res.sendStatus(403); return; }

        let filePath = getFilePath(req.params.id, true);
        
        let fileSize = statSync(filePath).size
        let range = req.headers.range
        
        if(range) {
            let parts = range.replace(/bytes=/, "").split("-");
            let start = parseInt(parts[0], 10);
            let end = parts[1] ? parseInt(parts[1], 10) : fileSize-1
        
            if(start >= fileSize) { res.status(416).send("out of range"); return; }
        
            let chunksize = (end-start)+1;
            let fileStream = createReadStream(filePath, {start, end});
        
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            });
            fileStream.pipe(res)
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            })
            createReadStream(path).pipe(res)
        }
    } catch(err) { res.statusCode(400) }
})

export default router;