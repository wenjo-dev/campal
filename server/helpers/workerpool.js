import { join } from "path";
import workerpool from "workerpool";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export default (() => {
    var instance;

    function createInstance() {
        const instance = workerpool.pool(
            join(__dirname, "./workerpoolFunctions.js"),
            { minWorkers: "max" }
        );
        return instance;
    }

    if(!instance) {
        instance = createInstance();
    }
    return instance;
})();