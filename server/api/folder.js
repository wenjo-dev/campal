import { Router } from "express"; const router = Router();
import { db, getContent, getOwner, getAllowed } from "../helpers/database.js";
import { indexFolder } from "../helpers/filesystem.js";

router.get("/info/:id", (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }
    try {
        let allowed = getAllowed(req.params.id);
        if(!req.session.admin && !allowed.users.includes(req.session.user) && !allowed.shares.includes(req.session.share)) { res.sendStatus(403); return; }

        res.json(db.prepare("SELECT * FROM folders WHERE id = ?").get(req.params.id));
    } catch(err) { console.log(err); res.sendStatus(500); }
})


router.get("/index/:id", async (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }
    try {
        let owner = getOwner(req.params.id);
        if(!req.session.admin && req.session.user != owner) { res.sendStatus(403); return; }

        await indexFolder(req.params.id);
        res.json(getContent(req.params.id, true));
    } catch(err) { console.log(err); res.sendStatus(500); }
})

export default router;