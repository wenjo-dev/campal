<script>
	export let params = {};
    import { request, stores, goToPage, urlDecode, urlEncode } from "../helper";
	import Icons from "../components/Basic/Icons.svelte";
	import FoldersGallery from "../components/Gallery/FoldersGallery.svelte";
	import FilesGallery from "../components/Gallery/FilesGallery.svelte";
	import Breadcrumbs from "../components/Basic/Breadcrumbs.svelte";
	import Download from "../components/Modals/Download.svelte";
	const listView = stores.options.listView;
    const notify = stores.notify;
	const changeView = stores.options.changeView;
	const download = stores.options.download;
    const downloadSelect = stores.options.downloadSelect;
	const filesSelected = stores.selected.files;

	let share = {};
	let content;
	let loaded = {exists: false, info: false, content: false};

	let password = {
		value: undefined,
		fail: false
	};

	let path = [];
    let breadcrumbs = [];
    let view = "list";

	async function login() {
		let res = await request(`share/login/${share?.id}`, "post", {password: password.value});
		if(!res.ok) {
			if(res.status == 403) password = {value: undefined, fail: true};
			else if(res.status == 410) share = undefined;
			return;
		}
		password.fail = false;
		share.auth = true;
		await load(true);
	}

	async function getShareContent(id) {
        let res = await request(`share/index/${id}`);
        if(!res.ok) { console.log(res.status); return; }

        content = await res.json();
    }

	async function getFolderContent(shareId, folderId) {
        let res = await request(`share/index/${shareId}/${folderId}`);
        if(!res.ok) { console.log(res.status); return; }

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
        if(!res.ok) { console.log(res.status); return; }

        share = {...await res.json(), auth: true};
        loaded.info = true;
		console.log(share)
    }

	async function load(force) {
		if(share?.url != params.url || force) {
			loaded = {}; share = {}; content = {};
			share.url = params.url;
			let res = await request(`shares/find/${share.url}`);
			loaded.exists = true;
			if(res.ok) share = {...await res.json(), url: params.url};
			else share = {};
			if(!share?.auth) return;
			await getInfo(share?.id);
		}

        loaded.content = false;
        if(params.path) {
            path = urlDecode(params.path);
            if(!path) { goToPage(`share/${params.url}`, true); return; }
                
            breadcrumbs = await Promise.all(path.map(async e => await getFolderName(e)));
            await getFolderContent(share?.id, path[path.length-1]);
        } else {
            path = [];
            breadcrumbs = [];
            await getShareContent(share?.id);
        }
		$changeView = true;
		if(content.files.length < 1) {
			$download = false;
            $downloadSelect = false;
		} else $download = true;

        loaded.content = true;
    }

	let scrolled = false;
    function scrollToTop() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
    window.addEventListener("scroll", (e) => {
        scrolled = window.scrollY > 100;
    })

	function handleKey(e) {
        if(e.keyCode == 13) {
            e.preventDefault();
            login();
        }
    }

	$: params, load();
	$: $listView, (() => view = $listView ? "list" : "grid" )();
	$: $downloadSelect, (() => {
        if(!$downloadSelect) $filesSelected = [];
    })();
    $: $notify, (() => {
        if($notify?.kind == "breadcrumb") {
            let index = $notify.index;
            $notify = {};
            if(index == -1) goToPage("share/"+params?.url);
            else goToPage(`share/${params?.url}/${urlEncode(path.slice(0, index+1))}`);
        } else if($notify?.kind == "folder") {
			let id = $notify.element.id;
			$notify = {};
			goToPage(`share/${params?.url}/${urlEncode([...path, id])}`);
		} else if($notify?.action == "download") {
            let kind = $notify?.kind; $notify = {};
            if(kind == "all") {
                if(path.length < 1) openDownloadModal({type: "share", share: share.id, name: share.name});
                else openDownloadModal({type: "folder", folder: path[path.length-1], name: breadcrumbs[breadcrumbs.length-1]});
            }
            else if(kind == "selected") openDownloadModal({type: "files", files: $filesSelected, name: share.name});
        }
    })();

	let openDownloadModal;

</script>

<div class="h-full overflow-x-hidden touch-pan-y">

{#if !loaded.exists}
<!-- loading -->
<div class="w-full flex justify-center items-center">
    <div class="w-full h-96 flex justify-center items-center">
        <span class="loading loading-dots loading-lg"></span>
    </div>
</div>
{:else if !share?.url}
<!-- doesn't exist -->
<div class="w-full flex justify-center items-center">
	<div class="card w-96 max-w-sm m-2 mt-12 shadow-xl p-6 bg-base-200">
		<h1 class="font-medium text-3xl text-center py-4">CamPal</h1>
		<div class="alert alert-error flex justify-center mt-8"><Icons icon="info"/>share doesn't exist or is expired</div>
	</div>
</div>
{:else if !share?.auth}
<!-- login -->
<div class="w-full flex justify-center items-center">
	<div class="card w-96 max-w-sm m-2 mt-12 shadow-xl p-6 bg-base-200" on:keydown={handleKey}>
		<h3 class="font-medium text-2xl text-center py mb-5">Login to share</h3>
		<input bind:value={password.value} type="password" placeholder="password" autocomplete="off" class="input w-full" autofocus />	
		{#if password.fail}<div class="alert alert-error mt-4"><span>wrong password</span></div>{/if}
		<button on:click={() => { if(password.value && password.value != "") login(); }} class="btn btn-secondary mt-6 w-full">Login</button>
	</div>
</div>
{:else}
<!-- content -->
	{#if !loaded.info}
		<div class="w-full h-96 flex justify-center items-center">
			<span class="loading loading-dots loading-lg"></span>
		</div>
	{:else}
	<div class="w-full p-2 md:flex md:justify-center">
		<div class="md:mr-5 card shadow-lg p-5 w-full">
			<h2 class="text-3xl font-bold">{share.name}</h2>
			{#if share.description}<p class="my-5">{share.description}</p>{/if}
		</div>
		<div class="flex flex-col justify-between shrink-0">
			<div class="card shadow-lg p-5 flex-grow">
				<div>
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
	</div>
	<Download bind:open={openDownloadModal}/>
	{/if}

	{#if !loaded.content}
        <div class="w-full h-96 flex justify-center items-center">
            <span class="loading loading-dots loading-lg"></span>
        </div>
    {:else}
        <div class="select-none">
            <div class="md mt-5"><Breadcrumbs bind:breadcrumbs={breadcrumbs} /></div>
            <FoldersGallery bind:view={view} folders={content.folders} />
			
            <FilesGallery bind:view={view} files={content.files} />
			
        </div>
    {/if}

{/if}

<button on:click={scrollToTop} class={`rounded-full w-14 h-14 bg-secondary text-secondary-content opacity-50 fixed right-5 bottom-5 flex items-center justify-center z-20 transform-gpu will-change-transform duration-500 ease-in-out active:scale-110 ${scrolled ? "translate-y-0" : "translate-y-24"}`}>
    <Icons icon="arrow_up" size=7/>
</button>

</div>