<script>
	export let params = {};
    import { request, stores, goToPage } from "../../frontend/src/helper";
	import Icons from "../../frontend/src/components/Basic/Icons.svelte";
	import FilesGallery from "../../frontend/src/components/Gallery/FilesGallery.svelte";
	import Download from "../../frontend/src/components/Modals/Download.svelte";
	const listView = stores.options.listView;
    const notify = stores.notify;
	const changeView = stores.options.changeView;
	const download = stores.options.download;
    const downloadSelect = stores.options.downloadSelect;
	const filesSelected = stores.selected.files;

	let files;
	let loaded = false;

    let view = "grid";

	async function load() {
        loaded = false;
		$changeView = true;

		let res = await request("timeline");
		if(!res.ok) return;
		files = await res.json();

		if(files.length < 1) {
			$download = false;
            $downloadSelect = false;
			$changeView = false;
		} else {
			$download = true;
			$changeView = true;
		}

        loaded = true;
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
        if($notify?.action == "download") {
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

{#if !loaded}
<!-- loading -->
<div class="w-full flex justify-center items-center">
    <div class="w-full h-96 flex justify-center items-center">
        <span class="loading loading-dots loading-lg"></span>
    </div>
</div>
{:else}

    <FilesGallery bind:view={view} files={files} />

{/if}

<button on:click={scrollToTop} class={`rounded-full w-14 h-14 bg-secondary text-secondary-content opacity-50 fixed right-5 bottom-5 flex items-center justify-center z-20 transform-gpu will-change-transform duration-500 ease-in-out active:scale-110 ${scrolled ? "translate-y-0" : "translate-y-24"}`}>
    <Icons icon="arrow_up" size=7/>
</button>

<Download bind:open={openDownloadModal}/>

</div>