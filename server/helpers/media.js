import { existsSync } from "fs";
import { join, extname } from "path";
import { getFilePath } from "./database.js";
import config from "./config.js";
import wp from "./workerpool.js";

export function isJpg(filepath) { let ext = extname(filepath).toLowerCase().split(".").slice(1).join("."); return (ext == "jpg" || ext == "jpeg"); }
export function isHeic(filepath) { return extname(filepath).toLowerCase().split(".").slice(1).join(".") == "heic"; }
export function isVideo(filepath) { return config.filetypes.videos.includes(extname(filepath).toLowerCase().split(".").slice(1).join(".")); }

export async function jpg(id) {
    let filepath = getFilePath(id, true);

    if(isJpg(filepath)) return filepath;

    let output = join(config.cachedir, id+".jpg");
    if(existsSync(output)) return output;

    if(isHeic(filepath)) await wp.proxy().then(wpp => wpp.heic2jpg(filepath, output));
    else if(isVideo(filepath)) await wp.proxy().then(wpp => wpp.video2jpg(filepath, output, 50));

    return output;
}

export async function getPreview(id, size) {
    let input = await jpg(id);
    let output = join(config.cachedir, `${id}${size ? "_"+size : ""}.webp`);

    if(!existsSync(output)) await wp.proxy().then(wpp => wpp.preview(input, output, size));
    
    return output;
}

export async function getSmallJpg(id) {
    let input = await jpg(id);

    let output = join(config.cachedir, `${id}_small.jpg`);

    if(!existsSync(output)) await wp.proxy().then(wpp => wpp.smalljpg(input, output));
    
    return output;
}