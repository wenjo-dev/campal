<script>
    import { stores, bloburl, request } from "../../helper";
    import Icons from "../Basic/Icons.svelte";

    const cache_small = stores.cache.small;
    const notify = stores.notify;
    const selectedFiles = stores.selected.files;
    const selectedFolders = stores.selected.folders;
    const excluded = stores.options.excluded;
    const downloadSelect = stores.options.downloadSelect;
    
    export let element, kind, view, shared;

    let loaded = false;

    let selected = isSelected();

    function isSelected() {
        if(kind == "file") return $selectedFiles.includes(element.id);
        else if(kind == "folder") return $selectedFolders.includes(element.id);
    }

    function select() {
        if(kind == "file" && !isSelected()) $selectedFiles = [...$selectedFiles, element.id];
        else if(kind == "folder") $selectedFolders = [...$selectedFolders, element.id];
    }

    function deselect() {
        if(kind == "file") $selectedFiles = $selectedFiles.filter(e => e != element.id);
        else if(kind == "folder") $selectedFolders = $selectedFolders.filter(e => e != element.id);
    }

    async function load() {
        if(!intersecting || loaded) return; // abort if already loaded

        let thumbnailId = (kind == "file" ? element.id : element.thumbnail);
        let cacheItem = ($cache_small.find(e => e.id == thumbnailId));
        if(cacheItem) element.thumbnailBlob = cacheItem.url;
        else if(thumbnailId) {
            let url = await bloburl(thumbnailId, 240);
            element.thumbnailBlob = url;
            $cache_small = [...$cache_small, {id: thumbnailId, url: url}];
        }

        if(kind == "share" && shared) {
            let res = await request(`share/info/${element.id}`);
            if(!res.ok) { goToPage("login", true); return; }
            element.username = await res.json().then(json => json.username);
            element = element;
        }

        loaded = true; // set loaded to true
    }

    function click() {
        if(($excluded || $downloadSelect) && (kind == "file" || kind == "folder")) {
            if($downloadSelect && kind == "folder") return;
            if(isSelected()) deselect();
            else select();
        }
        $notify = {action: ($excluded || $downloadSelect ? !selected ? "selected" : "deselected" : "clicked"), kind: kind, element: element};
    }

    $: $selectedFiles, selected = isSelected();
    $: $selectedFolders, selected = isSelected(); 

    // lazy loading
    import IntersectionObserver from "svelte-intersection-observer";
    let thisElement, intersecting;
    $: intersecting, load();
</script>

<IntersectionObserver once element={thisElement} bind:intersecting={intersecting} />

<!-- grid mode -->
{#if view == "grid"}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div bind:this={thisElement} on:click={click} class="transition-all ease-in-out duration-300 md:hover:scale-105 md:hover:z-10 card card-compact bg-base-100 shadow-xl aspect-square overflow-hidden m-1">
    
    <div class="w-full h-full flex items-center justify-center transition-all ease-in-out absolute z-10 {$excluded ? "bg-error" : $downloadSelect ? "bg-accent" : ""} {selected ? "opacity-80" : "opacity-0"}">
        <Icons icon={$excluded ? "x" : "download"} size=12/>
    </div>

    <!-- description if album or folder -->
    {#if kind == "share" || kind == "folder"}
    <div class="absolute top-0 w-full flex items-center justify-center bg-base-200 bg-opacity-80 z-10">
        <div class="p-1 break-all">{element.name}</div>
    </div>

    <div class="absolute -bottom-1 -right-1 w-10 h-10 flex items-start justify-start rounded-lg p-2 bg-base-200 bg-opacity-80 z-10">
        <Icons icon={kind}/>
    </div>

    <!-- video icon for video files -->
    {:else if kind =="file" && element.type == "video"}
        <div class="absolute -bottom-1 -right-1 w-10 h-10 flex items-start justify-start rounded-lg p-2 bg-base-200 bg-opacity-80 z-10">
            <Icons icon="video"/>
        </div>
    {/if}

    <div class="flex items-center justify-center h-full w-full  -z-0">
        <!-- loading thumbnail -->
        {#if !loaded} <span class="loading loading-spinner loading-lg"></span>
        {:else}
            <!-- thumbnail if thumbnailBlob exists -->
            {#if element.thumbnailBlob}
                <!-- svelte-ignore a11y-missing-attribute -->
                <img draggable="false" class="w-full h-full object-cover" src={element.thumbnailBlob} />
            <!-- placeholder if no thumbnail exists -->
            {:else}
                <div class="w-full h-full flex items-center justify-center opacity-50">
                    <Icons icon={kind} size=8/>
                </div>
            {/if}
        {/if}
    </div>
</div>


<!-- list mode -->
{:else if view == "list"}
<tr bind:this={thisElement} on:click={click} class="transition-all ease-in-out md:hover:bg-base-200 {$excluded && selected ? "bg-error text-error-content" : ""} {$downloadSelect && selected ? "bg-accent text-accent-content" : ""}">
    <!-- svelte-ignore a11y-missing-attribute -->

    <!-- thumbnail column -->
    <td class="w-24">
        <div class="flex items-center justify-center h-16 w-16 rounded-lg shadow-lg relative overflow-hidden">
            <!-- video icon if video file -->
            {#if kind =="file" && element.type == "video"}
                <div class="absolute -bottom-1 -right-1 w-8 h-8 flex items-start justify-start p-1 rounded-lg bg-base-200 bg-opacity-80 z-10 overflow-hidden">
                    <Icons icon="video"/>
                </div>
            {/if}

            <!-- loading thumbnail -->
            {#if !loaded}<span class="loading loading-spinner loading-lg"></span>
            {:else}
                <!-- thumbnail if thumbnailBlob exists -->
                {#if element.thumbnailBlob}
                    <img draggable="false" class="h-full w-full object-cover" src={element.thumbnailBlob} />
                <!-- placeholder if no thumbnail exists -->
                {:else}
                    <Icons icon={kind}/>
                {/if}
            {/if}
        </div>
    </td>

    <!-- name column -->
    <td class="font-bold">{element.name}</td>

    <!-- kind depending columns-->

    <!-- share -->
    {#if kind == "share"}
        <!-- last modified / last scanned -->
        <td>{new Date(element.timestamp).toLocaleDateString()}</td>
        {#if !shared}
            <!-- share url -->
            <td class="hidden sm:table-cell">{element.url ? element.url : ""}</td>
            <!-- password -->
            <td class="hidden sm:table-cell">{#if element.pw}<Icons icon="key"/>{/if}</td>
            <!-- user shares -->
            <td class="hidden sm:table-cell">{element.users.length > 0 ? element.users.length : ""}</td>
        {:else}
            <!-- share username -->
            <td class="hidden sm:table-cell">{element.username ? element.username : ""}</td>
        {/if}

    <!-- file -->
    {:else if kind == "file"}
        <!-- capture date / time -->
        <td class="hidden sm:table-cell">{element.datetimeoriginal ? new Date(element.datetimeoriginal).toLocaleString() : ""}</td>
        <!-- camera -->
        <td class="hidden sm:table-cell">{element.camera_manufacturer || ""} {element.camera_model || ""}</td>
    {/if}
</tr>


{/if}