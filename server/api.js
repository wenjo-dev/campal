import { Router } from "express"; const router = Router();

// route files
import userRoute from "./api/user.js";
import usersRoute from "./api/users.js"
import basedirRoute from "./api/basedir.js";
import basedirsRoute from "./api/basedirs.js";
import folderRoute from "./api/folder.js";
import sharesRoute from "./api/shares.js";
import shareRoute from "./api/share.js";
import fileRoute from "./api/file.js";
import filesystemRoute from "./api/filesystem.js";
import downloadRoute from "./api/download.js";
import adminRoute from "./api/admin.js";


// routes
router.use("/user", userRoute);
router.use("/users", usersRoute);
router.use("/basedir", basedirRoute);
router.use("/basedirs", basedirsRoute);
router.use("/folder", folderRoute);
router.use("/shares", sharesRoute);
router.use("/share", shareRoute);
router.use("/file", fileRoute);
router.use("/filesystem", filesystemRoute);
router.use("/download", downloadRoute);
router.use("/admin", adminRoute);


export default router;