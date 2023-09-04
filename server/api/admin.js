import { Router } from "express"; const router = Router();
import { db } from "../helpers/database.js";
import { readdirSync, statSync, unlinkSync } from "fs";
import config from "../helpers/config.js";
import { join } from "path";


router.get("/stats", (req, res) => {
    try {

        let cachecount = 0;
        let cachesize = 0;
        for(let i of readdirSync(config.cachedir)) {
            let stats = statSync(join(config.cachedir, i));
            if(!stats.isFile()) continue;
            cachecount++;
            cachesize += stats.size;
        }

        res.json({
            db: {
                images: db.prepare("SELECT count(*) FROM files WHERE type = ?").pluck().get("image"),
                videos: db.prepare("SELECT count(*) FROM files WHERE type = ?").pluck().get("video"),
                folders: db.prepare("SELECT count(*) FROM folders").pluck().get(),
                shares: db.prepare("SELECT count(*) FROM shares").pluck().get(),
                cumulated_size: db.prepare("SELECT SUM(size) FROM files").pluck().get(),
                different_cameras: db.prepare("SELECT count(DISTINCT camera_model) FROM metadata WHERE camera_model IS NOT NULL").pluck().get()
            },
            cache: {
                count: cachecount,
                size: cachesize
            }
        })
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.get("/clearcache", (req, res) => {
    if(!req.session.admin) { res.sendStatus(403); return; }

    try {
        for(let i of readdirSync(config.cachedir)) {
            let stats = statSync(join(config.cachedir, i));
            if(!stats.isFile()) continue;
            unlinkSync(join(config.cachedir, i));
        }

        res.sendStatus(204);
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.get("/indexstatus", (req, res) => {
    if(!req.session.admin) { res.sendStatus(403); return; }

    try {
        console.log("CHECKING STATUS")
        let jobs = db.prepare("SELECT * FROM jobs").all();
        let test = [];
        for(let j of jobs) {
            test.push({name: j.name, done: j.tasks_done / j.tasks_total})
        }
        res.json(test);
    } catch(err) { console.log(err); res.sendStatus(500); }
})



export default router;