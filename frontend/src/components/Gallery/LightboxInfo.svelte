<script>
    import { request } from "../../helper";
    import PreviewMap from "./PreviewMap.svelte";

    export let info;
    let locationName = "";
    let filePath = "";
    let size;

    let activeTab = 0;

    function toFraction(time) {
        return (time ? 1+"/"+Math.round(1/time)+" s" : null);
    }

    function check(input) {
        return !(input == null || input == 0 || String(input).includes("null"));
    }

    async function getLocationName() {
        try {
            let res = await fetch("https://nominatim.openstreetmap.org/reverse?lat="+info.gps_lat+"&lon="+info.gps_lon+"&format=json").then(res => res.json());
            locationName = (res.display_name != undefined ? res.display_name : "");
        } catch(e) {
            locationName = "";
        }
    }

    async function getPath() {
        let res = await request("file/path/"+info.id);
        if(!res.ok) return;

        filePath = await res.text();
    }

    async function calcSize() {
        size = Math.round(info.size / (1024*1024) * 100) / 100 + " MiB";
    }

    async function update() {
        getPath();
        calcSize();
        if(info.gps_lat != null) getLocationName();
        else if(activeTab == 2) activeTab = 0;
    }

    $: info && update();
</script>

<div class="w-full">
    <div class="tabs w-full flex justify-center">
        <!-- svelte-ignore a11y-missing-attribute -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <a on:click={() => activeTab = 0} class={"tab bg-base-200 tab-lifted"+(activeTab == 0 ? " tab-active" : "")}>file</a> 
        <!-- svelte-ignore a11y-missing-attribute -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        {#if info.type != "video"}
        <a on:click={() => activeTab = 1} class={"tab bg-base-200 tab-lifted"+(activeTab == 1 ? " tab-active" : "")}>exif</a>
        {/if}
        <!-- svelte-ignore a11y-missing-attribute -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        {#if info.gps_lat != null}
            <a on:click={() => activeTab = 2} class={"tab bg-base-200 tab-lifted"+(activeTab == 2 ? " tab-active" : "")}>location</a>
        {/if}
    </div>
    <div class="card w-full bg-base-100 shadow-xl">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="card-body">
            <!-- svelte-ignore empty-block -->
            {#if activeTab == 0}
                <table class="table">
                    <tbody>
                        <tr>
                            <td>name</td>
                            <td class="break-all">{info.name}</td>
                        </tr>
                        {#if filePath}
                        <tr>
                            <td>filepath</td>
                            <td class="break-all">{filePath}</td>
                        </tr>
                        {/if}
                        <tr>
                            <td>size</td>
                            <td class="break-all">{size}</td>
                        </tr>
                    </tbody>
                </table>
            {:else if activeTab == 1}
                <table class="table">
                    <tbody>
                        <tr>
                            <td>date/time</td>
                            <td class="break-all">{new Date(info.datetimeoriginal).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>camera</td>
                            <td class="break-all">{info.camera_manufacturer+" "+info.camera_model}</td>
                        </tr>
                        {#if check(info.lens_manufacturer)}
                        <tr>
                            <td>lens</td>
                            <td class="break-all">{info.lens_manufacturer+" "+(info.lens_model || "")}</td>
                        </tr>
                        {/if}
                        {#if check(info.focallength)}
                        <tr>
                            <td>focal length</td>
                            <td>{Math.round(info.focallength * 100)/100+" mm"}</td>
                        </tr>
                        {/if}
                        {#if check(info.aperture)}
                        <tr>
                            <td>aperture</td>
                            <td>{"f/"+info.aperture}</td>
                        </tr>
                        {/if}
                        {#if check(info.exposure_time)}
                        <tr>
                            <td>shutter speed</td>
                            <td>{toFraction(info.exposure_time)}</td>
                        </tr>
                        {/if}
                        {#if check(info.iso)}
                        <tr>
                            <td>ISO</td>
                            <td>{info.iso}</td>
                        </tr>
                        {/if}
                        <tr>
                            <td>resolution</td>
                            <td>{Math.round(info.width * info.height / 1e4) / 100} MP ({info.width} x {info.height})</td>
                        </tr>
                    </tbody>
                </table>
            {:else if activeTab == 2 && info.gps_lat != null}
                <p>{locationName}</p>
                <!-- svelte-ignore missing-declaration -->
                <PreviewMap lat={info.gps_lat} lon={info.gps_lon}/>
            {/if}
        </div>
    </div>
</div>