import { existsSync, readdirSync, statSync, unlinkSync } from "fs";
import { join, extname } from "path";
import exifr from "exifr";
import { db, getContent, getFilePath, getFolderPath } from "./database.js";
import config from "./config.js";
import jobs from "./jobs.js";
import wp from "./workerpool.js";

export function fsinfo(elementPath) { // returns code: 0 = nonex./invalid; 1 = directory; 2 = image; 3 = video
    try {
        let stats = statSync(elementPath);
        let ext = extname(elementPath).toLowerCase().split(".").slice(1).join(".");
        return { code: stats.isDirectory() ? 1
            : config.filetypes.images.includes(ext) ? 2
            : config.filetypes.videos.includes(ext) ? 3
            : 0,
            size: stats.size
        }
    } catch(e) { return false }
}

function purgeObsoleteDbEntries(id) {
    let content = getContent(id);
    for(let folder of content.folders) fsinfo(getFolderPath(folder)) || removeFolder(folder);
    for(let file of content.files) fsinfo(getFilePath(file, true)) || db.prepare("DELETE FROM files WHERE id = ?").run(file);

    // remove obsolete folder thumbnails entries
    let folders = db.prepare("SELECT id, thumbnail FROM folders").all().filter(e => e.thumbnail);
    for(let folder of folders) if(!fsinfo(getFilePath(folder.thumbnail))) db.prepare("UPDATE folders SET thumbnail = ? WHERE id = ?").run(null, folder.id);
}

function setParentThumbnails(id) {
    function getParents(id, isFolder = false) {
        let parentId = db.prepare("SELECT parent_id FROM "+(isFolder ? "folders" : "files")+" WHERE id = ?").get(id).parent_id;
        if(parentId == 0) return [];
        return [parentId, ...getParents(parentId, true)];
    }

    function hasNoThumbnail(id) {
        return ! db.prepare("SELECT thumbnail FROM folders WHERE id = ?").get(id).thumbnail;
    }

    let parentsWithoutThumbnails = getParents(id).filter(e => hasNoThumbnail(e));
    
    let updateStatement = db.prepare("UPDATE folders SET thumbnail = ? WHERE id = ?");
    for(let p of parentsWithoutThumbnails) updateStatement.run(id, p);
}

export async function indexFolderMT(id, parentjob, recursive = false) {
    await wp.proxy().then(wpp => wpp.indexFolder(id, recursive));
    console.log("running index in wp");
}



export async function indexFolder(id, recursive = false, parentjob) {

    let parentThumbnailsSet = false;

    jobs.add("index_folder_"+id, parentjob); // track process

    let folderPath = getFolderPath(id);

    if(!existsSync(folderPath)) return;

    for(let e of readdirSync(folderPath)) { // iterate over elements
        
        jobs.taskAdd(jobs.get("index_folder_"+id).id); // track process

        let elementPath = join(folderPath, e);
        let info = fsinfo(elementPath);
        if(info) switch(info.code) {
            case 1: // folder

                // ignore certain elements
                if(e.toLowerCase().includes("thumb") || e.toLowerCase().includes("cache") || e.startsWith(".")) continue;


                let subfolderId = db.prepare("SELECT id FROM folders WHERE name = ? AND parent_id = ?").pluck().get(e, id);
                if(!subfolderId) {
                    subfolderId = db.prepare("INSERT INTO folders (name, parent_id) VALUES (?, ?)").run(e, id).lastInsertRowid;
                    db.prepare("UPDATE folders SET timestamp = ? WHERE id = ?").run(Date.now(), id); // update folder timestamp if folder changed
                }
                if(recursive) await indexFolder(subfolderId, true, jobs.get("index_folder_"+id).id); // recursively index subfolders
                break;
            case 2: // image
                let file = db.prepare("SELECT id, size FROM files WHERE name = ? AND parent_id = ?").get(e, id);

                if(file) { // file exists
                    if(info.size == file.size) {
                        jobs.taskDone(jobs.get("index_folder_"+id).id);
                        if(!parentThumbnailsSet) { setParentThumbnails(file.id); parentThumbnailsSet = true; } // set parent thumbnails
                        continue; // skip if already in db
                    } else { // file changed
                        db.prepare("DELETE FROM files WHERE id = ?").run(file.id); // delete old entry in db
                        for(preview of readdirSync(config.cachedir)) {
                            if(preview.startsWith(file.id)) unlinkSync(join(config.cachedir, preview)); // delete previews
                        }
                    }
                } 
                file = db.prepare("INSERT INTO files (name, parent_id, type, size) VALUES (?,?,?,?)").run(e, id, "image", info.size).lastInsertRowid;

                if(!parentThumbnailsSet) { setParentThumbnails(file); parentThumbnailsSet = true; } // set parent thumbnails

                let exif = await exifr.parse(elementPath).catch((err) => {return {}});
                db.prepare("INSERT INTO metadata VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
                    file,
                    exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).getTime() : null,
                    exif?.Make,
                    exif?.Model,
                    exif?.Software,
                    exif?.SerialNumber,
                    exif?.LensMake,
                    exif?.LensModel,
                    exif?.LensSerialNumber,
                    exif?.ExposureTime,
                    exif?.FNumber,
                    exif?.ISO,
                    exif?.FocalLengthIn35mmFormat,
                    exif?.Flash,
                    exif?.ExposureCompensation,
                    exif?.latitude,
                    exif?.longitude,
                    exif?.GPSAltitude,
                    exif?.ExifImageWidth,
                    exif?.ExifImageHeight
                );
                db.prepare("UPDATE folders SET timestamp = ? WHERE id = ?").run(Date.now(), id); // update folder timestamp if folder changed
                break;
            case 3: // video
                let videoId = db.prepare("SELECT id FROM files WHERE name = ? AND parent_id = ?").pluck().get(e, id);
                if(videoId) { // file exists
                    jobs.taskDone(jobs.get("index_folder_"+id).id)
                    if(!parentThumbnailsSet) { setParentThumbnails(videoId); parentThumbnailsSet = true; } // set parent thumbnails
                    continue;
                } 
                videoId = db.prepare("INSERT INTO files (name, parent_id, type, size) VALUES (?,?,?,?)").run(e, id, "video", info.size).lastInsertRowid;

                if(!parentThumbnailsSet) { setParentThumbnails(videoId); parentThumbnailsSet = true; } // set parent thumbnails

                db.prepare("UPDATE folders SET timestamp = ? WHERE id = ?").run(Date.now(), id); // update folder timestamp if folder changed
                break;
        }
        jobs.taskDone(jobs.get("index_folder_"+id).id);
    };

    // track process
    let job = jobs.get("index_folder_"+id);
    if(job.tasks_total == job.tasks_done) jobs.remove(job.id);

    purgeObsoleteDbEntries(id);
}

