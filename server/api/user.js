// global modules
import { Router } from "express"; const router = Router();
import { hash, compare } from "bcrypt";
// helpers
import { db, removeFolder } from "../helpers/database.js";

router.post("/login", async (req, res) => {
    let user = db.prepare("SELECT * FROM users WHERE name = ?").get(req.body.name);
    // abort if not existent
    if(!user) { res.sendStatus(404); return; }
    // abort if wrong password
    else if(!await compare(req.body.password, user.password)) { res.sendStatus(403); return; }
    // set session if successfull
    req.session.user = user.id;
    req.session.admin = user.admin;
    res.send("logged in");
})

router.get("/logout", async (req, res) => {
    if(!req.session.user) { res.statusCode(404); return; }

    req.session.destroy();
    res.send("logged out")
})

router.get("/", (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }

    let id = req.query.id ? req.query.id : req.session.user;
    if(!id) { res.sendStatus(400); return }

    try {
        let user = db.prepare("SELECT id, name, full_name, admin FROM users WHERE id = ?").get(id);
        if(!user) { res.sendStatus(404); return }

        res.json(user);
    }
    catch(err) { res.statusCode(500); }
})

router.put("/", async (req, res) => {
    let id = (req.session.admin && req.query.id) ? req.query.id : req.session.user;
    if(!id) { res.sendStatus(400); return }

    if(((req.session.admin && id == req.session.user && req.body.password) || (!req.session.admin && req.body.password)) &&
        (!req.body.currentPassword || !await compare(req.body.currentPassword, db.prepare("SELECT password FROM users WHERE id = ?").pluck().get(id)))
    ) { res.sendStatus(400); return; }

    try {
        let currentValues = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

        let newValues = [
            req.body.name ? req.body.name : currentValues.name,
            req.body.password  ? await hash(req.body.password, 10) : currentValues.password,
            req.body.full_name ? req.body.full_name : currentValues.full_name,
            req.session.admin ? (req.body.admin || currentValues.admin) : currentValues.admin];

        if(newValues.name != currentValues.name && db.prepare("SELECT id FROM users WHERE name = ?").pluck().get(req.body.name)) { res.sendStatus(409); return; }

        db.prepare("UPDATE users SET name = ?, password = ?, full_name = ?, admin = ? WHERE id = ?").run([...newValues, id]);
        res.send("updated")
    } catch(err) { res.sendStatus(500); }
})

router.post("/", async (req, res) => {
    if(!req.session.admin) { res.sendStatus(403); return; }

    try {
        if(db.prepare("SELECT id FROM users WHERE name = ?").pluck().get(req.body.name)) { res.sendStatus(409); return; }
        db.prepare("INSERT INTO users(name, password, full_name, admin) VALUES (?,?,?,?)").run(
            req.body.name, await hash(req.body.password, 10), req.body.full_name, req.body.admin);
        res.sendStatus(201);
    } catch(err) { res.sendStatus(500); }
})

router.delete("/", async (req, res) => {
    if(!req.session.admin) { res.sendStatus(403); return; }

    try {
        let id = db.prepare("SELECT id FROM users WHERE id = ?").pluck().get(req.query.id);
        if(!id) { res.sendStatus(404); return; }

        db.prepare("DELETE FROM users WHERE id = ?").run(id);
        let basedirs = db.prepare("SELECT id FROM basedirs WHERE user_id = ?").pluck().all(id);
        for(let b of basedirs) { // remove basedirs of user
            removeFolder(db.prepare("SELECT folder_id FROM basedirs WHERE id = ?").pluck().get(b));
            db.prepare("DELETE FROM basedirs WHERE id = ?").run(b);
        }
        res.sendStatus(202)
    } catch(err) { res.sendStatus(500); }
})

export default router;