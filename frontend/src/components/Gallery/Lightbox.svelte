<script>
    import { stores, bloburl } from "../../helper";
    import { swipe } from 'svelte-gestures';
    import LightboxInfo from "./LightboxInfo.svelte";
    import PanZ from "@thesoulfresh/pan-z";
    import Icons from "../Basic/Icons.svelte";
    import Download from "../Modals/Download.svelte";
    import SwapLogo from "../Basic/SwapLogo.svelte";

    export var active;
    export var files;

    var current;

    export const open = (id) => {
        current = files.find(e => e.id == id);
        active = true;
        update();
    };

    var clicktimer = null;
    var mousepos = { x: null, y: null };

    // pz
    var image;
    var pz;

    function addPanZ() {
        if(!image) return;

        if(pz) { pz.reset(); return; }

        pz = new PanZ({
            minZoom: 1,
            bounds: Number.MIN_VALUE,
            maxZoom: 6
        }, image);
        pz.disablePan();
        
        pz.on("update", (e) => {
            if(!active) return;
            if(e.scale > 1.1) {
                if(res < 4) getFullResolution();
                if(!pz.panEnabled) pz.enablePan();
            } else if(pz.panEnabled) pz.disablePan();
        });
    }

    // blob cache
    const cache_small = stores.cache.small;
    const cache_medium = stores.cache.medium;
    const cache_large = stores.cache.large;
    var res = -1; // -1 = not loaded at all; 0 = loading thumbnail; 1 = thumbnail size; 2 = loading medium; 3 = medium size; 4 = loading full size; 5 = full size; 7 = video

    var controlsVisible = true;
    var infoVisible = false;
    var slideshowRunning = false;
    var slideshowTimer;
    var isMobile;
    var fullscreen = false;

    function checkFSMobile() {
        isMobile = (/Android|iPhone/i.test(navigator.userAgent));
        fullscreen = window.innerHeight === screen.height;
    }

    async function getSmallResolution() {
        res = 0;
        if($cache_small.map(e => e.id).includes(current.id)) {
            current.url = $cache_small.find(e => e.id == current.id).url;
        } else {
            res = 1;
            current.url = await bloburl(current.id, 240);
            $cache_small = [...$cache_small, {id: current.id, url: current.url}];
        }
        res = 1;
    }

    async function getMediumResolution() {
        res = 2;
        if($cache_medium.map(e => e.id).includes(current.id)) {
            current.url = $cache_medium.find(e => e.id == current.id).url;
        } else {
            current.url = await bloburl(current.id, 1080);
            $cache_medium = [...$cache_medium, {id: current.id, url: current.url}];
        }
        res = 3;
    }

    async function getFullResolution() {
        console.log("getting full res")
        res = 4;
        if($cache_large.map(e => e.id).includes(current.id)) {
            current.url = $cache_large.find(e => e.id == current.id).url;
        } else {
            current.url = await bloburl(current.id);
            $cache_large = [...$cache_large, {id: current.id, url: current.url}];
        }
        res = 5;
    }

    function toggleControls() {
        controlsVisible = !controlsVisible;
    }

    function toggleInfo() {
        if(!infoVisible) {
            infoVisible = true;
            if(pz) pz.disableZoom();
        } else {
            infoVisible = false;
            if(pz) pz.enableZoom();
        }
    }

    async function update() {
        res = -1;

        if(current.type == "image") {
            await getSmallResolution();
            if(fullscreen) getFullResolution();
            else getMediumResolution();
            addPanZ();
        } else if(current.type == "video") {
            slideshowRunning = false;
            current.url = "/api/file/stream/"+current.id;
            res = 7;
        }
    }

    function close() {
        if(pz) {
            pz.destroy();
            pz = undefined;
        };
        active = false;
    }

    function previous() {
        let index = files.findIndex(e => e.id == current.id);
        let length = files.length;

        index == 0 ? index = length - 1 : index = index - 1;
        current = files[index];

        update();
    }

    function next() {
        let index = files.findIndex(e => e.id == current.id);
        let length = files.length;

        index >= length - 1 ? index = 0 : index = index + 1;
        current = files[index];

        update();
    }

    function handleSwipe(e) {
        if(pz && pz.scale > 1.1) return false;

        switch(e.detail.direction) {
            case "right": previous(); break;
            case "left": next(); break;
            case "bottom": close();
        }
    }

    function click() {
        if(clicktimer == null) {
            clicktimer = setTimeout(() => {
                // single click
                toggleControls();
                clicktimer = null;
            }, 200);
        } else {
            // double click
            if(pz) {
                pz.disableZoom();
                if(pz.scale < 1.8) pz.zoomTo(2);
                else pz.zoomTo(1);
                pz.enableZoom();
            };
            clearTimeout(clicktimer);
            clicktimer = null;
        }
    }

    function handleMouseDown(e) {
        mousepos = { x: e.clientX, y: e.clientY };
    }

    function handleMouseUp(e) {
        if (Math.abs(mousepos.x - e.clientX) < 20 && Math.abs(mousepos.y - e.clientY) < 20) click();
    }

    function handleKey(e) {
        if(!active) return;
        e.preventDefault();
        switch(e.keyCode) {
            case 37: previous(); break;
            case 39: next(); break;
            case 27: close();
        }
    }

    function controlSlideshow() {
        if(slideshowRunning) slideshowTimer = setTimeout(() => {
            next();
            controlSlideshow();
        }, 3000);
        else {
            clearTimeout(slideshowTimer);
            slideshowTimer = null;
        }
    }

    function toggleFullscreen() {
        fullscreen = (window.innerHeight === screen.height)
        
        if(fullscreen) closeFullscreen();
        else openFullscreen();
    }

    function openFullscreen() {
        let doc = document.documentElement;
        if (doc.requestFullscreen) {
            doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) { /* Safari */
            doc.webkitRequestFullscreen();
        } else if (doc.msRequestFullscreen) { /* IE11 */
            doc.msRequestFullscreen();
        }
        fullscreen = true;
    }
    
    function closeFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        fullscreen = false;
    }

    function handleBars() {
        if(active) {
            document.documentElement.style.overflow = "hidden";
            document.body.scroll = "no";
        } else {
            document.documentElement.style.overflow = "auto";
            document.body.scroll = "yes";
        }
    }

    function toggleThemeColor() {
        let metaThemeColor = document.querySelector("meta[name=theme-color]");
        if(!controlsVisible) metaThemeColor.setAttribute("content", "black");
        else metaThemeColor.setAttribute("content", "data-theme");
    }

    var openDownloadModal;

    checkFSMobile();

    $: controlsVisible, toggleThemeColor();
    $: slideshowRunning, controlSlideshow();
    $: active, (() => {
        handleBars();
        if(!active && fullscreen) toggleFullscreen();
    })();

</script>

<svelte:window on:keydown={handleKey} />
  
<div class={`touch-none fixed h-screen w-screen z-30 overflow-hidden left-0 top-0 transition-all duration-500 ease-in-out transform-gpu will-change-transform ${(active ? " translate-y-0" : " translate-y-full")} bg-base-100`}>
    <div class={`transition-opacity -z-10 ease-in-out duration-500 absolute w-full h-full bg-black ${(controlsVisible ? "opacity-0" : "opacity-100")}`}></div>
    <div class={`absolute -top-px w-full z-31 bg-base-100 opacity-95 flex justify-between items-center overflow-hidden transition-all transform-gpu will-change-transform h-16 duration-500 ${(controlsVisible ? " translate-y-0" : " -translate-y-16")}`}>
            <button on:click={close} class="btn btn-ghost btn-circle px-2 ml-2">
                <Icons icon="x"/>
            </button>

            <div class="flex items-center">
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <button on:click={toggleInfo} class="btn btn-ghost btn-circle px-2">
                    <Icons icon="info"/>
                </button>

                <!-- download button -->
                <button on:click={() => openDownloadModal({file: current.id, type: "file", name: current.name})} class="btn btn-ghost btn-circle px-2">
                    <Icons icon="download"/>
                </button>
            </div>
            <div>
                <!-- control slideshow -->
                <button class="btn btn-ghost btn-circle px-2">
                    <SwapLogo iconon="pause" iconoff="play" bind:bind={slideshowRunning} disabled={false}/>
                </button>

                <!-- toggle fullscreen -->
                {#if !isMobile}
                <button class="btn btn-ghost btn-circle px-2" on:click={toggleFullscreen}>
                    <SwapLogo iconon="minimize" iconoff="maximize" bind:bind={fullscreen} disabled={true}/>
                </button>
                {/if}
            </div>
    </div>

    <button on:click={next} class={`rounded-full w-14 h-14 bg-base-200 opacity-50 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center transition-transform ease-in-out duration-500 active:scale-110 will-change-transform transform-gpu ${controlsVisible ? "translate-x-0" : "translate-x-24"}`}>
        <Icons icon="arrow_right" size=7/>
    </button>

    <button on:click={previous} class={`rounded-full w-14 h-14 bg-base-200 opacity-50 absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center transition-transform ease-in-out duration-500 active:scale-110 will-change-transform transform-gpu ${controlsVisible ? "translate-x-0" : "-translate-x-24"}`}>
        <Icons icon="arrow_left" size=7/>
    </button>
    
    <div class={"transition-all ease-in-out duration-500 "+(controlsVisible ? " opacity-100" : " opacity-0")}>
        <div class="bg-base-200 opacity-50 p-2 rounded absolute left-4 top-20">
            {#if res % 2 == 0} <span class="loading loading-spinner loading-xs"></span> {/if}
            {(() => {
            switch(res){
                case 0: return "loading thumbnail...";
                case 1: return "thumbnail";
                case 2: return "loading preview...";
                case 3: return "preview";
                case 4: return "loading full resolution...";
                case 5: return "full resolution";
                case 7: return "video";
            }})()}</div>

        <div class="bg-base-200 opacity-50 p-2 rounded absolute right-4 top-20">{
            (files.findIndex(e => e?.id == current?.id) + 1) + " / " + (files.length)}</div>

        {#if current != null}
            <div class={`p-2 absolute top-16 h-0 left-0 right-0 mx-auto max-w-xl will-change-transform transform-gpu transition-transform ease-in-out duration-500 origin-top ${infoVisible ? "scale-y-100" : "scale-y-0"}`}>
                <LightboxInfo info={current} />
            </div>
        {/if}
    </div>

    {#if active}
        <div use:swipe={{ timeframe: 300, minSwipeDistance: 100}} on:swipe={handleSwipe} on:mousedown={handleMouseDown} on:mouseup={handleMouseUp} class="absolute flex justify-center items-center w-screen h-screen top-0 left-0 -z-10 overflow-hidden">
            {#if current.type == "video"}
                <!-- svelte-ignore a11y-media-has-caption -->
                <video controls autoplay><source src={current.url} type="video/mp4" /></video>
            {:else if current.type == "image"}
                <!-- svelte-ignore a11y-media-has-caption -->
                <!-- svelte-ignore a11y-missing-attribute -->
                <img bind:this={image} id="image" draggable="false" class="w-full h-full object-contain" src={current?.url}/>
            {/if}
        </div>
    {/if}
    
</div>

<Download bind:open={openDownloadModal}/>