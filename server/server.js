// load config
import config from "./helpers/config.js";
// import db
import { db } from "./helpers/database.js";

// import modules and setup app
import express from "express";
import expressStaticGzip from "express-static-gzip";
const app = express();
import session from "express-session";
import SqliteStore from "better-sqlite3-session-store";
const store = SqliteStore(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    store: new store({
        client: db,
        expired: {
            clear: true,
            intervalMs: config.cookieAge
        }
    }),
    name: "campal",
    secret: config.sessionSecret,
    cookie: { maxAge: config.cookieAge },
    resave: false,
    saveUninitialized: false,
    secure: false
}));

app.use("/", expressStaticGzip("./server/public"));

import apiRoute from "./api.js";
app.use("/api", apiRoute);

// Default response for any other request
app.use((req, res) => {
    res.status(404);
});

// start server
app.listen(4000, () => {
    console.log("Server running: http://localhost:"+4000);
});

process.on('exit', code => {
    // Only synchronous calls
    console.log(`Process exited with code: ${code}`)
})

process.on('uncaughtException', err => {
    console.log(`Uncaught Exception: ${err.message}`)
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at ', promise, `reason: ${reason.message}`)
    process.exit(1)
})
