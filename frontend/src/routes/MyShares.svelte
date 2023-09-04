<script>
	export let params = {};

    import { stores, goToPage, request, urlDecode, urlEncode } from "../helper";
    import Icons from "../components/Basic/Icons.svelte";
    import Breadcrumbs from "../components/Basic/Breadcrumbs.svelte";
    import FoldersGallery from "../components/Gallery/FoldersGallery.svelte";
    import FilesGallery from "../components/Gallery/FilesGallery.svelte";
    import EditShare from "../components/Modals/EditShare.svelte";
    import MySharesGallery from "../components/Gallery/MySharesGallery.svelte";
    import Download from "../components/Modals/Download.svelte";
    const listView = stores.options.listView;
    const notify = stores.notify;
    const editShare = stores.options.editShare;
    const excluded = stores.options.excluded;
    const download = stores.options.download;
    const downloadSelect = stores.options.downloadSelect;
    const shareAllowed = stores.options.share;
    const filesSelected = stores.selected.files;
    const foldersSelected = stores.selected.folders;
    const changeView = stores.options.changeView;

    $excluded = false;
    $shareAllowed = false;

    let shares;
    let share;
    let content;
    let users;

    let path = [];
    let breadcrumbs = [];

    let view = "list";
    let loaded = {info: false, content: false};

    async function getShares() {
        let res = await request("shares");
        if(!res.ok) { goToPage("login", true); return; }

        shares = await res.json().then(res => res?.my);
    }

    async function getShareContent(id, all = false) {
        let res = await request(`share/index/${id}${all ? "/-/all" : ""}`);
        if(!res.ok) { goToPage("login", true); return; }

        content = await res.json();
    }

    async function getFolderContent(shareId, folderId, all = false) {
        let res = await request(`share/index/${shareId}/${folderId}${all ? "/all" : ""}`);
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

        users = await Promise.all(share.users.map(async e => {
            let res = await request(`user?id=${e}`);
            if(!res.ok) { console.log(res.status); return; }
            let user = await res.json();
            return {
                id: e,
                name: user.name,
                full_name: user.full_name
            }
        }))
        loaded.info = true;
    }

    async function load() {
        loaded.content = false;
        if(params.share) {
            shares = undefined;
            $editShare = true;

            if(params?.share != share?.id) await getInfo(params.share);

            if(params.path) {
                path = urlDecode(params.path);
                if(!path) { goToPage(`myshares/${params.share}`, true); return; }
                
                breadcrumbs = await Promise.all(path.map(async e => await getFolderName(e)));
                await getFolderContent(params.share, path[path.length-1], $excluded);
            } else {
                path = [];
                breadcrumbs = [];
                await getShareContent(params.share, $excluded);
            }
            if(content.files.length < 1) {
                $download = false;
                $downloadSelect = false;
            } else $download = true;
            if($excluded) {
                $download = false;
                $downloadSelect = false;
                $filesSelected = [];
                for(let f of content.files) if(f.excluded) $filesSelected = [...$filesSelected, f.id];
                $foldersSelected = [];
                for(let f of content.folders) if(f.excluded) $foldersSelected = [...$foldersSelected, f.id];
            }
        } else {
            $editShare = false;
            $download = false;
            $downloadSelect = false;
            share = undefined;
            content = undefined;
            await getShares();
        }
        $changeView = true;
        loaded.content = true;
    }

    async function applyChangeExcludes() {
        let res = await request(`share/excludes/${share.id}`, "put", {files: $filesSelected, folders: $foldersSelected});
        if(!res.ok) { return; }
        
        cancelChangeExcludes();
    }

    function cancelChangeExcludes() {
        $excluded = false;
        $filesSelected = [];
        $foldersSelected = [];
    }

    let scrolled = false;
    function scrollToTop() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
    window.addEventListener("scroll", (e) => {
        scrolled = window.scrollY > 100;
    })

    let openEditShareModal;
    let openDownloadModal;

    $: params, load();
    $: $excluded, (() => {
        load();
    })();
    $: $downloadSelect, (() => {
        if(!$downloadSelect) $filesSelected = [];
    })();
    $: $listView, (() => view = $listView ? "list" : "grid" )();
    $: $notify, (() => {
        if($notify?.action == "clicked" && $notify?.kind == "share") { let id = $notify?.element.id; $notify = {}; goToPage("myshares/"+id); }
        else if($notify?.kind == "share" && $notify?.action == "updated") { let id = $notify.id; $notify = {}; getInfo(id); }
        else if($notify?.kind == "share" && $notify?.action == "deleted") { $notify = {}; goToPage("myshares", true) }
        else if($notify?.kind == "breadcrumb") {
            let index = $notify.index;
            $notify = {};
            if(index == -1) goToPage("myshares/"+params?.share);
            else goToPage(`myshares/${params?.share}/${urlEncode(path.slice(0, index+1))}`);
        } else if($notify?.kind == "folder" && $notify?.action == "clicked") {
            let id = $notify.element.id; $notify = {}; goToPage(`myshares/${params?.share}/${urlEncode([...path, id])}`);
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
    <!-- list own shares -->
    {#if shares}
        <MySharesGallery bind:view={view} bind:shares={shares} />
    <!-- album content -->
    {:else if share && content}
        {#if !loaded.info}
            <div class="w-full h-96 flex justify-center items-center">
                <span class="loading loading-dots loading-lg"></span>
            </div>
        {:else}
            <div class="w-full p-2 md:flex md:justify-center">
                <div class="md:mr-5 card shadow-lg p-5 grow basis-1/2">
                    <div class="flex justify-start items-center">
                        <button on:click={() => goToPage("myshares")} class="btn btn-circle btn-sm btn-outline mr-5"><Icons icon="back" size=3/></button>
                        <h2 class="text-3xl font-bold">{share.name}</h2>
                    </div>
                    {#if share.description}<p class="my-5">{share.description}</p>{/if}
                </div>
                <div class="shrink-0 grow md:flex md:flex-col md:justify-between">
                    <div class="card shadow-lg p-5 flex-grow">
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
                        {#if share.url}
                        <a class="flex justify-start items-center mt-5" href={window.location.origin+"/#/share/"+share.url}>
                                <h6 class="text-sm font-light flex"><Icons icon="world"/><span class="mx-2">public:</span></h6>
                                {#if share.pw}<span class="mr-2"><Icons icon="key"/></span>{/if}
                                <span class="text-sm" >{share.url}</span>
                        </a>
                        {/if}
                        {#if users && users.length > 0}
                            <h6 class="text-sm font-light mt-5 flex"><Icons icon="users"/><span class="ml-2">allowed users:</span></h6>
                            <ul class="text-sm list-disc ml-6 mt-2">
                                {#each users as user (user)}
                                    <li>{user.name} {user.full_name && user.full_name ? "("+user.full_name+")" : ""}</li>
                                {/each}
                            </ul>
                        {/if}
                    </div>

                    <div class="p-5 mt-2 flex justify-between items-center bg-neutral rounded-lg text-neutral-content shadow-lg {$downloadSelect ? "opacity-50 pointer-events-none" : ""}">
                        <div class="flex justify-left items-center {!$excluded ? "opacity-50" : ""}">
                            <input type="checkbox" class="toggle mr-2" bind:checked={$excluded} />
                            <span>manage excludes</span>
                        </div>

                        {#if $excluded}
                        <div class="flex justify-left items-center">
                            <button on:click={applyChangeExcludes} class="btn ml-2 btn-outline text-neutral-content">
                                <Icons icon="check"/>
                                <span class="hidden md:inline">apply</span>
                            </button>
                            <button on:click={cancelChangeExcludes} class="btn ml-2 btn-outline text-neutral-content">
                                <Icons icon="x"/>
                                <span class="hidden md:inline">cancel</span>
                            </button>
                        </div>

                        {:else}
                        <button on:click={() => openEditShareModal(share.id)} class="btn ml-2 btn-outline text-neutral-content">
                            <Icons icon="edit"/>
                            edit
                        </button>
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
                <Breadcrumbs bind:breadcrumbs={breadcrumbs} />
                <FoldersGallery bind:view={view} folders={content.folders} />
            </div>
            <FilesGallery bind:view={view} files={content.files} />
        </div>
        {/if}

        <EditShare bind:open={openEditShareModal} />
        <Download bind:open={openDownloadModal} />
    {/if}
{/if}

<button on:click={scrollToTop} class={`rounded-full w-14 h-14 bg-secondary text-secondary-content opacity-50 fixed right-5 bottom-5 flex items-center justify-center z-20 transform-gpu will-change-transform duration-500 ease-in-out active:scale-110 ${scrolled ? "translate-y-0" : "translate-y-24"}`}>
    <Icons icon="arrow_up" size=7/>
</button>

</div>