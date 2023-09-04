<script>
    import { stores, getCurrentPage } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    import { location } from "svelte-spa-router";
    import SwapLogo from "../Basic/SwapLogo.svelte";
    import ThemeMenu from "./ThemeMenu.svelte";

    let currentPage;
    const active = stores.menus.left;
	const rightMenu = stores.menus.right;
    const themeMenu = stores.menus.theme;
    const downloadMenu = stores.menus.download;

    const notify = stores.notify;
    const listView = stores.options.listView;
    const share = stores.options.share;
    const download = stores.options.download;
    const downloadSelect = stores.options.downloadSelect;
    const changeView = stores.options.changeView;

    function hideMenu() { setTimeout(() => $active = false, 50) }

    $active = false;
    $downloadSelect = false;
    $: $location, (() => currentPage = getCurrentPage())();
    $: $notify, (() => {
        if($notify?.action == "download" && $notify?.kind == "start") { $downloadSelect = false; hideMenu(); }
    })();

</script>

<div class="rounded-xl bg-base-200 p-2 flex items-center justify-center">
    {#if $download}
    <div class="relative">
        <button class="btn btn-ghost btn-circle" on:click={() => { $downloadMenu = !$downloadMenu; $themeMenu = false; $rightMenu = true; }}>
            <Icons icon="download"/>
        </button>

        <div class={`p-2 shadow-xl bg-base-100 -z-10 absolute left-0 top-20 rounded-box w-52 transition-transform ease-in-out duration-500 transform-gpu will-change-transform origin-top ${$downloadMenu ? "scale-y-100": "scale-y-0"}`}>
            <button class="btn btn-secondary w-full" on:click={ () => { setTimeout(() => $downloadMenu = false, 50); $notify = {action: "download", kind: ($downloadSelect ? "selected" : "all")}; }}>
                <Icons icon="download"/>
                download
            </button>
                <label class="label cursor-pointer w-full flex items-center justify-end">
                    <span class="label-text text-xs font-semibold">
                        <span class={$downloadSelect ? "opacity-50" : "opacity-100"}>all</span> / 
                        <span class={$downloadSelect ? "opacity-100" : "opacity-50"}>selected</span>
                        <span class="opacity-50">files</span>
                    </span> 
                    <input type="checkbox" class="toggle ml-2" bind:checked={$downloadSelect} />
                </label>
            </div>
        </div>
    {/if}

    {#if $share}
        <button class="btn btn-ghost btn-circle" on:click={ () => { $notify = {action: "addShare"}; }}>
            <Icons icon="share"/>
        </button>
    {/if}

    {#if $changeView}
    <button class="btn btn-ghost btn-circle" on:click={() => {$listView = !$listView;}}>
        <SwapLogo bind:bind={$listView} iconon="grid" iconoff="list" disabled={true}/>
    </button>
    {/if}

    <ThemeMenu/>
</div>