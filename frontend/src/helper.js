import { get } from "svelte/store";
import { location, push, replace } from "svelte-spa-router";
import { writable } from "svelte/store";

export function compare(a, b, asc) {
    let order = asc ? 1 : -1;
    if(typeof(a) == "number" && typeof(b) == "number") return (a < b ? -1 : b < a ? 1 : 0) * order;
    else return String(a).localeCompare(String(b)) * order;
}

export async function request(relUrl, method, body) {
    let generalOptions = {
        method: (method ? method.toUpperCase() : "GET"),
        credentials: "include",
        redirect: "follow"
    }
    if(!method || !["POST", "PUT"].includes(method.toUpperCase())) return fetch("/api/"+relUrl, generalOptions);
    else return fetch("/api/"+relUrl, Object.assign(generalOptions, {
        cache: "no-cache",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    }));
}

export async function bloburl(id, size) {
    return await request(`file/preview/${id}/${size}`)
        .then(res => res.blob())
        .then(blob => URL.createObjectURL(blob));
}

export function timePickPresets(daysFromNow) {
    let preset = new Date();
    preset.setDate(preset.getDate() + daysFromNow);
    preset.setHours(0,0,0,0);
    preset = new Date(preset.getTime() - preset.getTimezoneOffset() * 60000);
    preset = preset.toISOString().slice(0,16);

    let minimum = new Date();
    minimum = new Date(minimum.getTime() - minimum.getTimezoneOffset() * 60000);
    minimum = minimum.toISOString().slice(0,16);

    return {preset: preset, minimum: minimum}
}

export function timeToShortLocaleISO(timeMillis) {
    let date = new Date(timeMillis);
    date = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return date.toISOString().slice(0,16);
}

export function urlEncode(obj) { 
    try { return encodeURIComponent(JSON.stringify(obj)); }
    catch(err) { return ""; }
}

export function urlDecode(uriString) {
    try { return JSON.parse(decodeURIComponent(uriString)); }
    catch(err) { return null; }
}

export function getCurrentPage() {
    return get(location).split("/").filter(e => e != "")[0];
}
export function goToPage(page, withoutHistory = false) {
    if(withoutHistory) replace("/"+page);
    else push("/"+page);
}

export function disableDocScroll() {
    document.documentElement.style.overflow = "hidden";
    document.body.scroll = "no";
}
export function enableDocScroll() {
    document.documentElement.style.overflow = "auto";
    document.body.scroll = "yes";
}

export const stores = {
    notify: writable({}),
    menus: {
        left: writable(false),
        right: writable(false),
        theme: writable(false),
        download: writable(false)
    },
    options: {
        download: writable(false),
        downloadSelect: writable(false),
        share: writable(false),
        editShare: writable(false),
        listView: writable(false),
        excluded: writable(false),
        changeView: writable(false),
        sort: writable(false)
    },
    pages: {
        folders: writable(false),
        myshares: writable(false),
        shared: writable(false),
        admin: writable(false)
    },
    selected: {
        files: writable([]),
        folders: writable([])
    },
    cache: {
        small: writable([]),
        medium: writable([]),
        large: writable([])
    }
}