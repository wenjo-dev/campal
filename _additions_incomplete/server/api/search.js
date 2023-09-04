import { Router } from "express"; const router = Router();
import { db, getOwner } from "../helpers/database.js";

router.get("/params", (req, res) => {
    req.session.admin = 1; req.session.user = 1;
    if(!req.session.user) { res.sendStatus(401); return; }

    try {
        if(req.params.all) {
            if(req.params.all != "all" ) { res.sendStatus(400); return; }
            else if(!req.session.admin) { res.sendStatus(403); return; }
        }

        let params = {
            datetimeoriginal: {
                min: db.prepare("SELECT min(datetimeoriginal) FROM metadata").pluck().get(),
                max: db.prepare("SELECT max(datetimeoriginal) FROM metadata").pluck().get()
            },
            camera: db.prepare("SELECT DISTINCT camera_manufacturer, camera_model, lens_manufacturer, lens_model  FROM metadata WHERE coalesce(camera_manufacturer, camera_model, lens_manufacturer, lens_model) IS NOT NULL").all(),
            exposure_time: {
                min: db.prepare("SELECT min(exposure_time) FROM metadata").pluck().get(),
                max: db.prepare("SELECT max(exposure_time) FROM metadata").pluck().get()
            },
            aperture: {
                min: db.prepare("SELECT min(aperture) FROM metadata").pluck().get(),
                max: db.prepare("SELECT max(aperture) FROM metadata").pluck().get()
            },
            iso: {
                min: db.prepare("SELECT min(iso) FROM metadata").pluck().get(),
                max: db.prepare("SELECT max(iso) FROM metadata").pluck().get()
            },
            focallength: {
                min: db.prepare("SELECT min(focallength) FROM metadata").pluck().get(),
                max: db.prepare("SELECT max(focallength) FROM metadata").pluck().get()
            },
            width: {
                min: db.prepare("SELECT min(width) FROM metadata").pluck().get(),
                max: db.prepare("SELECT max(width) FROM metadata").pluck().get()
            },
            height: {
                min: db.prepare("SELECT min(height) FROM metadata").pluck().get(),
                max: db.prepare("SELECT max(height) FROM metadata").pluck().get()
            }
        }
    
        console.log(params)
        res.json(params)

    } catch(err) { res.sendStatus(500); return; }
})

export default router;