<script>
	export let params = {};

    import { stores, goToPage, request, urlDecode, urlEncode } from "../helper";
    import Icons from "../components/Basic/Icons.svelte";
    import Breadcrumbs from "../components/Basic/Breadcrumbs.svelte";
    import FoldersGallery from "../components/Gallery/FoldersGallery.svelte";
    import FilesGallery from "../components/Gallery/FilesGallery.svelte";
    import SharedGallery from "../components/Gallery/SharedGallery.svelte";
    import Download from "../components/Modals/Download.svelte";
    const listView = stores.options.listView;
    const notify = stores.notify;
    const download = stores.options.download;
    const downloadSelect = stores.options.downloadSelect;
    const shareAllowed = stores.options.share;
    const filesSelected = stores.selected.files;
    const changeView = stores.options.changeView;

    $shareAllowed = false;

    let shares;
    let share;
    let content;

    let path = [];
    let breadcrumbs = [];

    let view = "list";
    let loaded = {info: false, content: false};

    let none = false;

    async function getShares() {
        let res = await request("shares");
        if(!res.ok) { goToPage("login", true); return; }

        shares = await res.json().then(res => res?.shared);
        if(shares.length < 1) {
            shares = undefined;
            none = true;
        } else none = false;
    }

    async function getShareContent(id) {
        let res = await request(`share/index/${id}`);
        if(!res.ok) { goToPage("login", true); return; }

        content = await res.json();
    }

    async function getFolderContent(shareId, folderId) {
        let res = await request(`share/index/${shareId}/${folderId}`);
        if(!res.ok) { goToPage("login", true); return; }

        content = await res.json();
    }

    async function getFolderName(id) {
        let res = await request("folder/info/"+id);
        if(!res.ok) { return; }

        return await res.json().then(res => res.name);
    }

    async function getInfo(id) {
        loaded.info = false;
        let res = await request(`share/info/${id}`);
        if(!res.ok) { goToPage("login", true); return; }

        share = await res.json();
        loaded.info = true;
    }

    async function load() {
        loaded.content = false;
        if(params.share) {
            shares = undefined;

            if(params?.share != share?.id) await getInfo(params.share);

            if(params.path) {
                path = urlDecode(params.path);
                if(!path) { goToPage(`shared/${params.share}`, true); return; }
                
                breadcrumbs = await Promise.all(path.map(async e => await getFolderName(e)));
                await getFolderContent(params.share, path[path.length-1]);
            } else {
                path = [];
                breadcrumbs = [];
                await getShareContent(params.share);
            }
            if(content.files.length < 1) {
                $download = false;
                $downloadSelect = false;
            } else $download = true;
        } else {
            share = undefined;
            content = undefined;
            await getShares();
            $download = false;
            $downloadSelect = false;
        }
        if((shares && shares.length > 0) || (share && (content.files.length > 0 || content.folders.length > 0))) $changeView = true;
        else $changeView = false;
        loaded.content = true;
    }

    let scrolled = false;
    function scrollToTop() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
    window.addEventListener("scroll", (e) => {
        scrolled = window.scrollY > 100;
    })

    let openDownloadModal;

    $: params, load();
    $: $listView, (() => view = $listView ? "list" : "grid" )();
    $: $downloadSelect, (() => {
        if(!$downloadSelect) $filesSelected = [];
    })();
    $: $notify, (() => {
        if($notify?.action == "clicked" && $notify?.kind == "share") { let id = $notify?.element.id; $notify = {}; goToPage("shared/"+id); }
        else if($notify?.kind == "breadcrumb") {
            let index = $notify.index;
            $notify = {};
            if(index == -1) goToPage("shared/"+params?.share);
            else goToPage(`shared/${params?.share}/${urlEncode(path.slice(0, index+1))}`);
        } else if($notify?.kind == "folder") {
            let id = $notify.element.id; $notify = {};
            goToPage(`shared/${params?.share}/${urlEncode([...path, id])}`);
        } else if($notify?.action == "download") {
            let kind = $notify?.kind; $notify = {};
            if(kind == "all") {
                if(path.length < 1) openDownloadModal({type: "share", share: share.id, name: share.name});
                else openDownloadModal({type: "folder", folder: path[path.length-1], name: breadcrumbs[breadcrumbs.length-1]});
            }
            else if(kind == "selected") openDownloadModal({type: "files", files: $filesSelected, name: share.name});
        }
    })();
</script>

<div class="h-full overflow-x-hidden touch-pan-y">

{#if !loaded.info && !loaded.content}
    <div class="w-full h-96 flex justify-center items-center">
        <span class="loading loading-dots loading-lg"></span>
    </div>
{:else}
    <!-- list of shares -->
    {#if shares}
        <SharedGallery bind:view={view} bind:shares={shares} />
    <!-- share content -->
    {:else if share && content}
        {#if !loaded.info}
            <div class="w-full h-96 flex justify-center items-center">
                <span class="loading loading-dots loading-lg"></span>
            </div>
        {:else}
        <div class="w-full p-2 md:flex md:justify-center">
            <div class="md:mr-5 card shadow-lg p-5 w-full md:max-w-xl">
                <div class="flex justify-start items-center">
                    <button on:click={() => goToPage("shared")} class="btn btn-circle btn-sm btn-outline mr-5"><Icons icon="back" size="3"/></button>
                    <h2 class="text-3xl font-bold">{share.name}</h2>
                </div>
                {#if share.description}<p class="my-5">{share.description}</p>{/if}
            </div>
            <div class="shrink-0 md:flex md:flex-col md:justify-between">
                <div class="card shadow-lg p-5 flex-grow">
                    <div class="flex justify-start items-center mt-5">
						<h6 class="text-sm font-light flex"><Icons icon="share"/><span class="mx-2">shared by:</span></h6>
						<span class="text-sm">{share.username}</span>
					</div>
                    <div class="flex justify-start items-center mt-5">
                        <h6 class="text-sm font-light flex"><Icons icon="edit"/><span class="mx-2">last change:</span></h6>
                        <span class="text-sm">{new Date(share.timestamp).toLocaleString()}</span>
                    </div>
                    {#if share.expires}
                        <div class="flex justify-start items-center mt-5">
                            <h6 class="text-sm font-light flex"><Icons icon="clock"/><span class="mx-2">expires:</span></h6>
                            <span class="text-sm">{new Date(share.expires).toLocaleString()}</span>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        {/if}

        {#if !loaded.content}
            <div class="w-full h-96 flex justify-center items-center">
                <span class="loading loading-dots loading-lg"></span>
            </div>
        {:else}
        <div class="select-none">
            <div class={$downloadSelect ? "opacity-50 pointer-events-none" : ""}>
                <div class="md mt-5"><Breadcrumbs bind:breadcrumbs={breadcrumbs} /></div>
            <FoldersGallery bind:view={view} folders={content.folders} />
            </div>
            <FilesGallery bind:view={view} files={content.files} />
        </div>
        {/if}
        <Download bind:open={openDownloadModal}/>
    {:else if none}
        <div class="w-full flex justify-center">
            <div class="card w-96 -2 h-48 shadow-xl bg-base-100 mt-32 p-5 flex items-center justify-center">
                <Icons icon="emoji_sad" size="48" />
                <span class="mt-5 font-semibold text-lg">There are no shares for you.</span>
            </div>
        </div>
    {/if}
{/if}

<button on:click={scrollToTop} class={`rounded-full w-14 h-14 bg-secondary text-secondary-content opacity-50 fixed right-5 bottom-5 flex items-center justify-center z-20 transform-gpu will-change-transform duration-500 ease-in-out active:scale-110 ${scrolled ? "translate-y-0" : "translate-y-24"}`}>
    <Icons icon="arrow_up" size=7/>
</button>

</div>