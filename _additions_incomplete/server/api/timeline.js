import { Router } from "express"; const router = Router();
import { db, getOwner } from "../helpers/database.js";

router.get("/", async (req, res) => {
    req.session.user = 1;
    if(!req.session.user) { res.sendStatus(403); return; }

    try {
        let files = db.prepare("SELECT * FROM files LEFT JOIN metadata ON files.id = metadata.file_id ORDER BY metadata.datetimeoriginal DESC").all();
        console.log(files.length);
        files = files.filter(e => getOwner(e.id, true) == req.session.user);

        res.json(files);
    } catch(err) { console.log(err); res.sendStatus(500); }
})

export default router;