<script>
    import { request, stores } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    const notify = stores.notify;

    let options;
    let info;
    let name;
    let loaded = false;

    var modal;
    export const open = (data) => {
        reset();
        modal.showModal();
        getOptions(data);
    }

    async function getOptions(data) {
        loaded = false;
        console.log(data);

        if(data.type == "file" || data.type == "folder" || data.type == "share") info = data.name;
        else {
            info = data.files.length+" files from ";
            if(data?.basedirs) {
                let res = await request("user");
                if(!res.ok) return;
                let username = await res.json().then(json => json.name);
                info += "basedirs of "+username;
                data.name = "basedirs of "+username
            } else {
                info += data.name;
                data.name = data.name+"_selection"
            }
        }

        let res = await request("download/options", "post", data);
        if(!res.ok) { console.log(res.status); return; }

        options = await res.json();
        loaded = true;
    }

    function reset() {
        options = [];
        info = "";
        name = "";
        loaded = false;
    }

    function abort() {
        modal.close();
    }

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box">
        {#if !loaded}
            <div class="w-full h-32 flex justify-center items-center">
                <span class="loading loading-dots loading-lg"></span>
            </div>
        {:else}

        <h3 class="font-bold text-lg text-center">download:</h3>
        <h3 class="text-md font-mono text-center mb-5 mt-2">{info}</h3>

        {#each options as option}
            <a on:click={() => {abort(); $notify = {action: "download", kind: "start"}}} class="btn w-full my-2" href={"/api/download/"+option.url} download={`${name}${option.name}`}>
                <Icons icon="download"/>
                {option.desc}
            </a>
        {/each}

        {/if}
        <button on:click={abort} class="btn btn-error w-full mt-5">
            <Icons icon="x"/>
            abort
        </button>
    </div>
</dialog>