import workerpool from "workerpool";
import heicconvert from "heic-convert";
import { readFileSync, writeFileSync } from "fs";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { join, parse } from "path";
import config from "./config.js";

// create workers
workerpool.worker({
    heic2jpg: async (input, output) => {
        let buffer = await heicconvert({
            buffer: readFileSync(input),
            format: "JPEG",
            quality: .75
        });
        writeFileSync(output, buffer);
        return output;
    },
    video2jpg: async (input, output, runtimePercent) => {
        return new Promise((resolve, reject) => {
            ffmpeg(input)
                .screenshots({
                    count: 1,
                    timestamps: [ runtimePercent+"%" ],
                    filename: parse(output).base,
                    folder: parse(output).dir})
                .on("end", resolve)
                .on("error", (err) => { return reject(new Error(err)) })
        })  
    },
    preview: async (input, output, size) => {
        if(size) await sharp(input)
        .rotate()
        .webp({quality: 50})
        .resize({
            width: size,
            height: size, 
            fit: "outside"
        })
        .toFile(output);

        else await sharp(input)
        .rotate()
        .webp({quality: 50})
        .toFile(output);

        return output;
    },
    smalljpg: async (input, output) => {
        await sharp(input)
        .withMetadata()
        .rotate()
        .jpeg({quality: 75})
        .toFile(output);

        return output;
    }
});