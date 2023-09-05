import { existsSync } from "fs";
import Database from "better-sqlite3";
import config from "./config.js";
import { join } from "path";
import { hashSync } from "bcrypt";

export const db = (() => {
    let instance;

    function createInstance() {
        let isNew = !existsSync(config.dbfile);
        let temp = new Database(config.dbfile, {  });
        temp.pragma("journal_mode = WAL");
        if(isNew) {
            console.log("creating new db")
            setupStructure(temp);
            setupInitial(temp);
        }
        return temp;
    }

    if(!instance) instance = createInstance();
    return instance;
})();

function setupStructure(db) {
    db.exec(`
        CREATE TABLE jobs (
            id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            started INTEGER NOT NULL,
            parent INTEGER,
            tasks_total INTEGER,
            tasks_done INTEGER,
            PRIMARY KEY(id AUTOINCREMENT));

        CREATE TABLE users (
            id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            password TEXT,
            full_name TEXT,
            admin INTEGER NOT NULL,
            PRIMARY KEY(id AUTOINCREMENT));
        
        CREATE TABLE basedirs (
            id INTEGER NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            path TEXT NOT NULL,
            folder_id INTEGER NOT NULL,
            PRIMARY KEY(id AUTOINCREMENT));
        
        CREATE TABLE folders (
            id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            thumbnail INTEGER,
            parent_id INTEGER NOT NULL,
            timestamp INTEGER,
            PRIMARY KEY(id AUTOINCREMENT));
        
        CREATE TABLE files (
            id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            parent_id INTEGER NOT NULL,
            type TEXT,
            size INTEGER,
            PRIMARY KEY(id AUTOINCREMENT));
        
        CREATE TABLE metadata (
            file_id INTEGER NOT NULL,
            datetimeoriginal INTEGER,
            camera_manufacturer TEXT,
            camera_model TEXT,
            camera_software TEXT,
            camera_serial TEXT,
            lens_manufacturer TEXT,
            lens_model TEXT,
            lens_serial TEXT,
            exposure_time REAL,
            aperture REAL,
            iso REAL,
            focallength REAL,
            flash INTEGER,
            exposure_compensation REAL,
            gps_lat REAL,
            gps_lon REAL,
            gps_alt REAL,
            width INTEGER,
            height INTEGER);
        
        CREATE TABLE shares (
            id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT,
            folder_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            thumbnail INTEGER,
            expires INTEGER,
            url TEXT,
            password TEXT,
            PRIMARY KEY(id AUTOINCREMENT));
        
        CREATE TABLE share_excludes (
            share_id INTEGER NOT NULL,
            element_id INTEGER NOT NULL,
            element_type INTEGER NOT NULL);
        
        CREATE TABLE share_users (
            share_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL);
        
        CREATE TABLE zips (
            url TEXT NOT NULL,
            content TEXT NOT NULL);
    `);
}

function setupInitial(db) {
    db.prepare("INSERT INTO users (name, password, admin) VALUES (?,?,?)").run("admin", hashSync("admin", 10), 1);
}

export function getFolderPath(id) {
    let folder = db.prepare("SELECT * FROM folders WHERE id = ?").get(id);

    return (folder.parent_id == 0
        ? db.prepare("SELECT path FROM basedirs WHERE folder_id = ?").get(folder.id).path
        : join(getFolderPath(folder.parent_id), folder.name));
}

export function getFilePath(id, withFilename = false) {
    let file = db.prepare("SELECT * FROM files WHERE id = ?").get(id);
    let path = file ? join(getFolderPath(file.parent_id), (withFilename ? file.name : "")) : "nope";
    return path;
}

export function getParentFolders(id, isFile = false) {
    let parent = db.prepare(`SELECT parent_id FROM ${isFile ? "files" : "folders"} WHERE id = ?`).pluck().get(id);
    if(parent == 0) return [];
    else return [parent, ...getParentFolders(parent)];
}

export function getOwner(id, isFile = false) {
    let element = db.prepare(`SELECT id, parent_id FROM ${isFile ? "files" : "folders"} WHERE id = ?`).get(id);
    if(element.parent_id > 0) return getOwner(element.parent_id);
    else return db.prepare("SELECT user_id FROM basedirs WHERE folder_id = ?").pluck().get(id);
}

export function getAllowed(id, isFile) {
    let owner = getOwner(id, isFile);
    let allowedUsers = [owner];
    let allowedShares = [];
    if(!isFile) {
        allowedUsers = [owner, ...db.prepare("SELECT DISTINCT share_users.user_id FROM share_users JOIN shares ON share_users.share_id = shares.id WHERE shares.folder_id = ?").pluck().all(id)];
        allowedShares = db.prepare("SELECT id FROM shares WHERE folder_id = ?").pluck().all(id);
    }
    for(let p of getParentFolders(id, isFile)) {
        allowedUsers = [...allowedUsers, ...db.prepare("SELECT DISTINCT share_users.user_id FROM share_users JOIN shares ON share_users.share_id = shares.id WHERE shares.folder_id = ?").pluck().all(p)];
        allowedShares = [...allowedShares, ...db.prepare("SELECT id FROM shares WHERE folder_id = ?").pluck().all(p)];
    }
    return {users: allowedUsers, shares: allowedShares};
}

export function isInShare(shareId, folderId) {
    if(db.prepare("SELECT * FROM shares WHERE id = ? AND folder_id = ?").pluck().get(shareId, folderId)) return true;
    else {
        let parent = db.prepare("SELECT parent_id FROM folders WHERE id = ?").pluck().get(folderId);
        if(parent > 0) return isInShare(shareId, parent);
        else return false;
    }
}

export function removeFolder(id) {
    let children = getContent(id);

    let fileDeleteStatement = db.prepare("DELETE FROM files WHERE id = ?");
    let folderDeleteStatement = db.prepare("DELETE FROM folders WHERE id = ?");

    for (let file of children.files) fileDeleteStatement.run(file);
    for (let folder of children.folders) folderDeleteStatement.run(folder);
    
    folderDeleteStatement.run(id);
}

export function getContent(id, advanced) {
    if(advanced == undefined) return { // simple id lists
        files: db.prepare("SELECT id FROM files WHERE parent_id = ?").all(id).map(e => e.id),
        folders: db.prepare("SELECT id FROM folders WHERE parent_id = ?").all(id).map(e => e.id)
    }

    return {
        files: db.prepare("SELECT * FROM files LEFT JOIN metadata ON files.id = metadata.file_id WHERE parent_id = ?").all(id),
        folders: db.prepare("SELECT * FROM folders WHERE parent_id = ?").all(id)
    }
}