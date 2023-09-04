<script>
    import Preview from "./Preview.svelte";
    import SwapLogo from "../Basic/SwapLogo.svelte";
    import Lightbox from "./Lightbox.svelte";
    import { stores, compare } from "../../helper";
    import { _tryRequireWorkerThreads } from "workerpool/src/WorkerHandler";

    const notify = stores.notify;
    const sortOptions = stores.options.sort;

    export let files;
    export let view;

    let lightbox = false;
    let openLightbox;

    var sortedBy;
    var asc = true;

    function sort(by) {
        if(by == sortedBy) asc = !asc;
        sortedBy = by;

        let temp = files;
        switch(by) {
            case "date": temp.sort((a, b) => compare(a.datetimeoriginal, b.datetimeoriginal, asc)); break;
            case "camera": temp.sort((a, b) => compare(a.camera_manufacturer+" "+a.camera_model, b.camera_manufacturer+" "+b.camera_model, asc)); break;
            case "name": temp.sort((a, b) => compare(a.name, b.name, asc)); break;
        }
        files = temp;
    }

    $: $notify, (() => {
        if($notify?.kind == "file" && $notify.action == "clicked") {
            openLightbox($notify.element.id);
            $notify = {};
        }
    })();
</script>

{#if files.length > 0}

<div class="divider mx-2">
    {files.length} FILE{#if files.length > 1}S{/if}
</div>

<!-- grid view -->
{#if view == "grid"}

<div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-11 mb-12 mx-1">
    {#each files as file (file)}
        <Preview element={file} kind="file" view="grid" shared={false}/>
    {/each}
</div>

<!-- list view -->
{:else if view == "list"}

<table class="table cursor-pointer">
    <thead class="shadow-sm bg-base-100">
        <tr>
            <th></th> <!-- thumbnail -->
            <th on:click={() => sort("name")}><div class="flex justify-start items-center">name {#if sortedBy == "name"}<span class="ml-2"><SwapLogo iconon="arrow_up" iconoff="arrow_down" disabled={true} bind:bind={asc} /></span>{/if}</div></th>
            <th class="hidden sm:table-cell" on:click={() => sort("date")}><div class="flex justify-start items-center">capture date {#if sortedBy == "date"}<span class="ml-2"><SwapLogo iconon="arrow_up" iconoff="arrow_down" disabled={true} bind:bind={asc} /></span>{/if}</div></th>
            <th class="hidden sm:table-cell" on:click={() => sort("camera")}><div class="flex justify-start items-center">camera {#if sortedBy == "camera"}<span class="ml-2"><SwapLogo iconon="arrow_up" iconoff="arrow_down" disabled={true} bind:bind={asc} /></span>{/if}</div></th>
        </tr>
    </thead>
    <tbody>
        {#each files as file (file)}
            <Preview bind:element={file} kind="file" view="list" shared={false}/>
        {/each}
    </tbody>
</table>

{/if}

<Lightbox bind:active={lightbox} bind:files={files} bind:open={openLightbox}/>

{/if}