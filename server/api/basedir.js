import { Router } from "express"; const router = Router();
import { db, removeFolder } from "../helpers/database.js";
import { join } from "path";

router.post("/", (req, res) => {
    if(!req.session.admin) { res.sendStatus(403); return; }

    let user_id = req.body.user_id;

    if(!user_id || !req.body.path) { res.sendStatus(400); return; }

    try {
        let folder_path = process.env.NODE_ENV == "production" ? "/campal/mounts" : "/";
        for(let part of req.body.path) folder_path = join(folder_path, part);

        let folder_name = "basedir_"+user_id+"_"+folder_path;

        let folder_id = db.prepare("INSERT INTO folders(name, parent_id) VALUES(?, ?)").run(folder_name, 0).lastInsertRowid;
        db.prepare("INSERT INTO basedirs (user_id, path, folder_id) VALUES (?,?,?)").run(user_id, folder_path, folder_id);
        res.sendStatus(201);
    } catch(err) { res.sendStatus(500); }
});

router.delete("/:id", (req, res) => {
    if(!req.session.admin) { res.sendStatus(403); return; }

    try {
        let id = db.prepare("SELECT id FROM basedirs WHERE id = ?").pluck().get(req.params.id);
        if(!id) { res.sendStatus(404); return; }

        removeFolder(db.prepare("SELECT folder_id FROM basedirs WHERE id = ?").pluck().get(id));
        db.prepare("DELETE FROM basedirs WHERE id = ?").run(id);
        res.sendStatus(202);
    } catch(err) { res.sendStatus(500); return; }
})

export default router;