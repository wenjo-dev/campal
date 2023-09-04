import { Router } from "express"; const router = Router();
import { db } from "../helpers/database.js";

router.get("/", (req, res) => {
    if(!req.session.user) { res.sendStatus(403); return }

    try { res.json(db.prepare("SELECT id, name, full_name, admin FROM users").all()); }
    catch(err) { res.statusCode(500); }
})

export default router;