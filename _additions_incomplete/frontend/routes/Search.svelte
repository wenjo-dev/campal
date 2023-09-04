<script>
	export let params = {};

    import { request, urlEncode, urlDecode, goToPage, stores } from "../helper";

    import FilesGallery from "../components/Gallery/FilesGallery.svelte";
    import FoldersGallery from "../components/Gallery/FoldersGallery.svelte";
    import Icons from "../components/Basic/Icons.svelte";
    import AddShare from "../components/Modals/AddShare.svelte";
    import Download from "../components/Modals/Download.svelte";

    const listView = stores.options.listView;
    const notify = stores.notify;
    const dlAllowed = stores.options.download;
    const shareAllowed = stores.options.share;
    const filesSelected = stores.selected.files;
    const downloadSelect = stores.options.downloadSelect;
    const selectedFiles = stores.selected.files;
    const changeView = stores.options.changeView;

    let loaded = false;
    let folders = [];
    let files = [];
    let view = "grid";

    async function search(string) {
        let searchparams = urlDecode(string);

        let res = await request("folder/index/"+id);
        if(!res.ok) { goToPage("login", true); return; }

        let content = await res.json();
        folders = content.folders;
        files = content.files;
    }

    let options;
    let set = {
        datetimeoriginal: {
            set: false,
            min: undefined,
            max: undefined
        },
        camera: {
            set: false,
            selected: []
        }
    }

    async function load() {
        loaded = false;
        let res = await request("search/params");
        if(!res.ok) return;

        options = await res.json();
        console.log(options)

        loaded = true;
    }

    let openAddShareModal;
    let openDownloadModal;

    load();


    let scrolled = false;
    function scrollToTop() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
    window.addEventListener("scroll", (e) => {
        scrolled = window.scrollY > 100;
    })

    $: $notify, (async () => {
        if($notify?.kind == "folder") {
            let element = $notify.element;
            $notify = {};
            let newPath = [...path, element.id];
            goToPage("folders/"+urlEncode(newPath));
        } else if($notify?.action == "download") {
            if($notify?.kind == "all") {
                $notify = {};
                if(path.length < 1) {
                    openDownloadModal({type: "files", files: files.map(e => e.id), name: "name", basedirs: true});
                }
                else openDownloadModal({type: "folder", folder: path[path.length-1], name: breadcrumbs[breadcrumbs.length-1]});
            } else if($notify?.kind == "selected") {
                $notify = {};
                let name = breadcrumbs[breadcrumbs.length-1];
                openDownloadModal({type: "files", files: $selectedFiles, name: name});
            }
        }
    })();

    $: $downloadSelect, (() => {
        if(!$downloadSelect) $filesSelected = [];
    })();

    $: params, load();
    $: $listView, (() => view = $listView ? "list" : "grid" )();
</script>

<div class="select-none h-full touch-pan-y">

{#if !params.searchparams}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="w-full p-5">

    {#if loaded}
    <div class="rounded-xl bg-base-100 shadow-xl p-5 m-5 max-w-fit {set.datetimeoriginal.set ? "bg-neutral text-neutral-content" : ""}">
        <div class="flex items-center justify-start mr-5 mb-5" on:click={() => set.datetimeoriginal.set = !set.datetimeoriginal.set}>
            <span class="text-sm uppercase font-semibold mr-2">capture date</span>
            <input type="checkbox" class="toggle toggle-sm point-events-none" bind:checked={set.datetimeoriginal.set}/>
        </div>
        <div class="flex justify-start items-center {set.datetimeoriginal.set ? "opacity-100 pointer-events-auto" : "opacity-50 pointer-events-none"}">
            <input type="datetime-local" bind:value={set.datetimeoriginal.min} class="input input-bordered" />
            <span class="mx-2 font-bold">-</span>
            <input type="datetime-local" bind:value={set.datetimeoriginal.max} class="input input-bordered" />
        </div>
    </div>

    <div class="rounded-xl bg-base-100 shadow-xl p-5 m-5 max-w-fit">
        <div class="flex items-center justify-start mr-5 mb-5" on:click={() => set.camera.set = !set.camera.set}>
            <span class="text-sm uppercase font-semibold mr-2">camera / lens</span>
            <input type="checkbox" class="toggle toggle-sm point-events-none" bind:checked={set.camera.set}/>
        </div>
        <div class="max-h-96 overflow-auto {set.camera.set ? "opacity-100 pointer-events-auto" : "opacity-50 pointer-events-none"}">
        {#each options.camera as opt}
            <label class="label cursor-pointer" on:click={() => { if(set.camera.selected.includes(opt)) set.camera.selected = set.camera.selected.filter(e => e != opt); else set.camera.selected = [...set.camera.selected, opt]; }}>
                <span class="label-text">{(() => {let name=""; for(let v of Object.values(opt)) name+=v+" "; return name})()}</span> 
                <input type="checkbox" checked={set.camera.selected.includes(opt)} class="checkbox pointer-events-none" />
            </label>
        {/each}
        </div>
    </div>
    {/if}

</div>

{:else if !loaded}
    <div class="w-full h-96 flex justify-center items-center">
        <span class="loading loading-dots loading-lg"></span>
    </div>
{:else}
    <div class={$downloadSelect ? "opacity-50 pointer-events-none" : ""}>
        <FoldersGallery bind:view={view} bind:folders={folders} />
    </div>
    <FilesGallery bind:view={view} files={files} />
{/if}

<button on:click={scrollToTop} class={`rounded-full w-14 h-14 bg-secondary text-secondary-content opacity-50 fixed right-5 bottom-5 flex items-center justify-center z-20 transform-gpu will-change-transform duration-500 ease-in-out active:scale-110 ${scrolled ? "translate-y-0" : "translate-y-24"}`}>
    <Icons icon="arrow_up" size=7/>
</button>

</div>

<AddShare bind:open={openAddShareModal}/>
<Download bind:open={openDownloadModal}/>