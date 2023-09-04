import { Router } from "express"; const router = Router();
import { db } from "../helpers/database.js";
import { indexFolder } from "../helpers/filesystem.js";

router.get("/:all?", (req, res) => {
    try {
        if(req.params.all) {
            if(req.params.all != "all" ) { res.sendStatus(400); return; }
            else if(!req.session.admin) { res.sendStatus(403); return; }

            res.json(db.prepare("SELECT * FROM basedirs ORDER BY user_id").all()); return;
        }

        if(!req.session.user) { res.sendStatus(401); return; }

        res.json(db.prepare("SELECT * FROM basedirs WHERE user_id = ?").all(req.session.user));
    } catch(err) { res.sendStatus(500); }
})

router.get("/index/:all?", async (req, res) => {
    if(!req.session.user) { res.sendStatus(403); return; }

    try {
        let basedirfolders;

        if(req.params.all) {
            if(req.params.all != "all" ) { res.sendStatus(400); return; }
            else if(!req.session.admin) { res.sendStatus(403); return; }
            basedirfolders = db.prepare("SELECT folder_id FROM basedirs").pluck().all();
        } else basedirfolders = db.prepare("SELECT folder_id FROM basedirs WHERE user_id = ?").pluck().all(req.session.user);

        for(let b of basedirfolders) await indexFolder(b, true);
        res.sendStatus(200);
    } catch(err) { console.log(err); res.sendStatus(500); }
})

export default router;