import { Router } from "express"; const router = Router();
import { fsinfo } from "../helpers/filesystem.js";
import { join } from "path";
import { readdirSync } from "fs";

router.get("/subfolders/:pathArr", (req, res) => {
    if(!req.session.admin) { res.sendStatus(403); return; }

    try {
        let fullPath = process.env.NODE_ENV == "production" ? "/campal/mounts" : "/";
        if(req.params.pathArr) {
            for(let part of JSON.parse(decodeURIComponent(req.params.pathArr))) fullPath = join(fullPath, part);
        }

        res.json(readdirSync(fullPath).filter(e => fsinfo(join(fullPath, e)).code == 1));
    } catch(err) { console.log(err); res.sendStatus(500); }
})


export default router;