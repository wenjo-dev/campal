<script>
	export let params = {};

    import { request, urlEncode, urlDecode, goToPage, stores } from "../helper";

    import FilesGallery from "../components/Gallery/FilesGallery.svelte";
    import FoldersGallery from "../components/Gallery/FoldersGallery.svelte";
    import Icons from "../components/Basic/Icons.svelte";
    import Breadcrumbs from "../components/Basic/Breadcrumbs.svelte";
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
    let path = [];
    let breadcrumbs = [];

    async function getBasedirsContent() {
        folders = [];
        files = [];

        let res = await request("basedirs");
        if(!res.ok) { goToPage("login", true); return; }

        for(let basedir of await res.json()) {
            let res = await request("folder/index/"+basedir.folder_id);
            if(!res.ok) { goToPage("login", true); return; }

            let content = await res.json();
            folders = [...folders, ...content.folders];
            files = [...files, ...content.files];
        }
    }

    async function getFolderContent(id) {
        let res = await request("folder/index/"+id);
        if(!res.ok) { goToPage("login", true); return; }

        let content = await res.json();
        folders = content.folders;
        files = content.files;
    }

    async function getFolderName(id) {
        let res = await request("folder/info/"+id);
        if(!res.ok) { goToPage("login", true); return; }

        return await res.json().then(res => res.name);
    }

    async function load() {
        loaded = false;

        $downloadSelect = false;

        if(params.path) {
            path = urlDecode(params.path);

            if(!path) { goToPage("folders", true); return; }

            breadcrumbs = await Promise.all(path.map(async e => await getFolderName(e)));
            await getFolderContent(path[path.length-1]);
            $shareAllowed = true;
        } else {
            path = [];
            breadcrumbs = [];
            await getBasedirsContent();
            $shareAllowed = false;
        }
        if(files.length > 0) $dlAllowed = true;
        else $dlAllowed = false;

        $changeView = true;
        loaded = true;
    }

    let openAddShareModal;
    let openDownloadModal;


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
        } else if($notify?.kind == "breadcrumb") {
            let index = $notify.index;
            $notify = {};
            if(index == -1) goToPage("folders");
            else goToPage("folders/"+urlEncode(path.slice(0, index+1)));
        } else if($notify?.action == "addShare") {
            $notify = {};
            openAddShareModal(path[path.length - 1]);
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

{#if !loaded}
    <div class="w-full h-96 flex justify-center items-center">
        <span class="loading loading-dots loading-lg"></span>
    </div>
{:else}
    <div class={$downloadSelect ? "opacity-50 pointer-events-none" : ""}>
        <Breadcrumbs bind:breadcrumbs={breadcrumbs}/>
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