if(!process.env.CAMPAL_DATA) {
    console.log("environment variable CAMPAL_DATA needs to be set!");
    process.exit(1);
}

import { nanoid } from "nanoid";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

let cachedir = join(process.env.CAMPAL_DATA, "cache");
if(!existsSync(cachedir)) mkdirSync(cachedir);

export default {
    sessionSecret: nanoid(64),
    cookieAge: 24 * 60 * 60 * 1000,
    cachedir: cachedir,
    dbfile: join(process.env.CAMPAL_DATA, "campal.sqlite"),
    filetypes: {
        images: ["jpg", "jpeg", "heic"],
        videos: ["mov", "mp4", "3gp"]
    }
}