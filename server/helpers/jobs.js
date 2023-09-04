import { db } from "./database.js";

function add(name, parent) {
    let id = db.prepare("SELECT id FROM jobs WHERE name = ?").pluck().get(name);
    if(!id) id = db.prepare("INSERT INTO jobs (name, started, parent, tasks_total, tasks_done) VALUES(?,?,?,?,?)").run(name, new Date().getTime(), parent, 0, 0).lastInsertRowid;
    return id;
}

function remove(id) {
    db.prepare("DELETE FROM jobs WHERE id = ?").run(id);
}

function taskAdd(id) {
    let job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
    db.prepare("UPDATE jobs SET tasks_total = ? WHERE id = ?").run(job?.tasks_total + 1, id);
    if(job.parent) taskAdd(job.parent);
}

function taskDone(id) {
    let job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
    db.prepare("UPDATE jobs SET tasks_done = ? WHERE id = ?").run(job?.tasks_done + 1, id);
    if(job.parent) taskDone(job.parent);
}

function get(name) {
    return db.prepare("SELECT * FROM jobs WHERE name = ?").get(name);
}

export default {
    add,
    remove,
    taskAdd,
    taskDone,
    get
}