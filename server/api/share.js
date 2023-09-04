import { Router } from "express"; const router = Router();
import { db, getAllowed, isInShare, getContent, getOwner } from "../helpers/database.js";
import { indexFolder } from "../helpers/filesystem.js";
import { hash, compare } from "bcrypt";

router.get("/index/:id/:folder?/:all?", async (req, res) => {
    try {
        if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }
        if(!db.prepare("SELECT id FROM shares WHERE id = ?").pluck().get(req.params.id)) { res.sendStatus(404); return; }
        if(req.params.all && !req.session.admin && req.session.user != db.prepare("SELECT user_id FROM shares WHERE id = ?").pluck().get(req.params.id)) { res.sendStatus(403); return; }

        let folderId;
        if(req.params.folder && req.params.folder > 0) {
            if(!isInShare(req.params.id, req.params.folder)) { res.sendStatus(403); return; }
            folderId = req.params.folder;
        } else {
            folderId = db.prepare("SELECT folder_id FROM shares WHERE id = ?").pluck().get(req.params.id);
        }

        let allowed = getAllowed(folderId);

        if(!req.session.admin && !allowed.users.includes(req.session.user) && !allowed.shares.includes(req.session.share)) { res.sendStatus(403); return; }

        await indexFolder(folderId);

        let content = getContent(folderId, true);
        let excluded = {
            files: db.prepare("SELECT element_id FROM share_excludes WHERE element_type = 0 AND share_id = ?").pluck().all(req.params.id),
            folders: db.prepare("SELECT element_id FROM share_excludes WHERE element_type = 1 AND share_id = ?").pluck().all(req.params.id)
        }

        if(!req.params.all) res.json({
            files: content.files.filter(e => !excluded.files.includes(e.id)),
            folders: content.folders.filter(e => !excluded.folders.includes(e.id))
        })

        else if(req.params.all == "all") res.json({
            files: content.files.map(e => { if(excluded.files.includes(e.id)) e.excluded = true; return e; }),
            folders: content.folders.map(e => { if(excluded.folders.includes(e.id)) e.excluded = true; return e; })
        })

        else res.sendStatus(400)
    
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.get("/info/:id", (req, res) => {
    if(!req.session.user && !req.session.share) { res.sendStatus(401); return; }

    try {
        let owner = db.prepare("SELECT user_id FROM shares WHERE id = ?").pluck().get(req.params.id);
        let allowed = [owner, ...db.prepare("SELECT user_id FROM share_users WHERE share_id = ?").pluck().all(req.params.id)];

        if(!req.session.admin && req.session.share != req.params.id && !allowed.includes(req.session.user)) { res.sendStatus(403); return; }

        let info = db.prepare("SELECT id, name, description, folder_id, expires, timestamp, url FROM shares WHERE id = ?").get(req.params.id);
        let pw = db.prepare("SELECT password FROM shares WHERE id = ?").pluck().get(req.params.id);
        let user = db.prepare("SELECT name, full_name FROM users WHERE id = ?").get(owner);
        info = {...info, pw: !(!pw || pw == ""), username: (user?.full_name ? user?.full_name : user?.name)}

        if(req.session.user == owner) info = {...info, users: db.prepare("SELECT user_id FROM share_users WHERE share_id = ?").pluck().all(req.params.id)}
    
        res.json(info);
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.post("/login/:id", async (req, res) => {
    try {
        let share = db.prepare("SELECT * FROM shares WHERE id = ?").get(req.params.id);

        if(!share) { res.sendStatus(404); return; }
        if(share.password && !await compare(req.body.password, share.password)) { res.sendStatus(403); return; }
        if(share.expires && ((new Date(share.expires).getTime() - new Date().getTime()) < 0)) { res.sendStatus(410); return; }

        req.session.share = share.id;
        res.sendStatus(200);
    } catch(err) { res.sendStatus(500); return; }
})    

router.post("/", async (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }

    try {
        if(!req.session.admin && req.session.user != getOwner(req.body.folder_id)) { res.sendStatus(403); return; }

        let thumbnail = db.prepare("SELECT thumbnail FROM folders WHERE id = ?").pluck().get(req.body.folder_id);

        let id = db.prepare("INSERT INTO shares (name, description, folder_id, user_id, url, password, expires, thumbnail, timestamp) VALUES (?,?,?,?,?,?,?,?,?)").run(
            req.body.name, req.body.description, req.body.folder_id, req.session.user, req.body.url, (req.body.password ? await hash(req.body.password, 10) : undefined), req.body.expires, thumbnail, Date.now()).lastInsertRowid;

        if(req.body.users)
            for(let user of req.body.users)
                if(!db.prepare("SELECT user_id FROM share_users WHERE share_id = ? AND user_id = ?").pluck().get(id, user))
                    db.prepare("INSERT INTO share_users (share_id, user_id) VALUES (?,?)").run(id, user);

        res.sendStatus(201);
    } catch(err) { console.log(err); res.sendStatus(500); }
});

router.delete("/:id", (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }

    try {
        let owner = db.prepare("SELECT user_id FROM shares WHERE id = ?").pluck().get(req.params.id);
        if(!owner) { res.sendStatus(404); return; }
        if(!req.session.admin && req.session.user != owner) { res.sendStatus(403); return; }

        db.prepare("DELETE FROM shares WHERE id = ?").run(req.params.id);
        db.prepare("DELETE FROM share_excludes WHERE share_id = ?").run(req.query.id);
        db.prepare("DELETE FROM share_users WHERE share_id = ?").run(req.query.id);

        res.sendStatus(204);
    } catch(err) { res.sendStatus(500); }
});

router.put("/excludes/:id", (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }

    try {
        let owner = db.prepare("SELECT user_id FROM shares WHERE id = ?").pluck().get(req.params.id);
        if(!owner) { res.sendStatus(404); return; }
        if(!req.session.admin && req.session.user != owner) { res.sendStatus(403); return; }

        db.prepare("DELETE FROM share_excludes WHERE share_id = ?").run(req.params.id);
        for(let f of req.body.files) db.prepare("INSERT INTO share_excludes (share_id, element_id, element_type) VALUES (?,?,0)").run(req.params.id, f);
        for(let f of req.body.folders) db.prepare("INSERT INTO share_excludes (share_id, element_id, element_type) VALUES (?,?,1)").run(req.params.id, f);

        res.sendStatus(202);
    } catch(err) { console.log(err); res.sendStatus(500); }
})

router.put("/:id", async (req, res) => {
    if(!req.session.user) { res.sendStatus(401); return; }

    try {
        let owner = db.prepare("SELECT user_id FROM shares WHERE id = ?").pluck().get(req.params.id);
        if(!owner) { res.sendStatus(404); return; }
        if(!req.session.admin && req.session.user != owner) { res.sendStatus(403); return; }

        let password = (req.body.password ? await hash(req.body.password, 10) : req.body.removepassword ? undefined : db.prepare("SELECT password FROM shares WHERE id = ?").pluck().get(req.params.id));

        db.prepare("UPDATE shares SET name = ?, description = ?, expires = ?, url = ?, password = ?, timestamp = ? WHERE id = ?").run(
            req.body.name, req.body.description, req.body.expires, req.body.url, password, Date.now(), req.params.id);

        db.prepare("DELETE FROM share_users WHERE share_id = ?").run(req.params.id);
        if(req.body.users)
            for(let user of req.body.users)
                if(!db.prepare("SELECT user_id FROM share_users WHERE share_id = ? AND user_id = ?").pluck().get(req.params.id, user))
                    db.prepare("INSERT INTO share_users (share_id, user_id) VALUES (?,?)").run(req.params.id, user);

        res.sendStatus(202);
    } catch(err) { console.log(err); res.sendStatus(500); }
});

export default router;