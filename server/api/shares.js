import { Router } from "express"; const router = Router();
import { db } from "../helpers/database.js";
import { customAlphabet } from "nanoid";

router.get("/checkurl/:url", (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }
    try {
        if(db.prepare("SELECT * FROM shares WHERE url = ?").pluck().get(req.params.url)) res.sendStatus(400);
        else res.sendStatus(200);
    } catch(err) { res.sendStatus(500); }
})

router.get("/randomurl", (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }

    try {
        res.send((function random() {
            let rnd = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 4)();
            if(db.prepare("SELECT * FROM shares WHERE url = ?").pluck().get(rnd)) return random();
            else return rnd;
        })());
    } catch(err) { res.sendStatus(500); }
})

router.get("/find/:url", (req, res) => {
    try {
        let share = db.prepare("SELECT id, password, expires FROM shares WHERE url = ?").get(req.params.url);
        if(!share) { res.sendStatus(404); return;}
        if(share.expires && ((new Date(share.expires).getTime() - new Date().getTime()) < 0)) { res.sendStatus(410); return; }

        if(!share.password) req.session.share = share.id;

        res.json({
            id: share.id,
            auth: !!req.session.share
            });
    } catch(err) {
        res.sendStatus(500);
    }
})

router.get("/:all?", (req, res) => {
    try {
        if(req.params.all) {
            if(req.params.all != "all" ) { res.sendStatus(400); return; }
            else if(!req.session.admin) { res.sendStatus(403); return; }

            res.json(db.prepare("SELECT * FROM shares").all()); return;
        }

        if(!req.session.user) { res.sendStatus(401); return; }

        let my = db.prepare("SELECT id, name, description, folder_id, expires, timestamp, url, thumbnail FROM shares WHERE user_id = ?").all(req.session.user);
        for(let i=0; i<my.length; i++) my[i] = {
            ...my[i],
            users: db.prepare("SELECT user_id FROM share_users WHERE share_id = ?").all(my[i].id),
            pw: !!db.prepare("SELECT password FROM shares WHERE id = ?").pluck().get(my[i].id)
        }

        res.json({
            my: my,
            shared: db.prepare("SELECT shares.* FROM shares JOIN share_users ON shares.id = share_users.share_id WHERE share_users.user_id = ?").all(req.session.user)
        });
    } catch(err) { res.sendStatus(500); }
})

export default router;