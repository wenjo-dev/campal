<script>
    import { stores, getCurrentPage, goToPage, request } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    import { location } from "svelte-spa-router";
    import SwapLogo from "../Basic/SwapLogo.svelte";

    const notify = stores.notify;
    let currentPage;
    const active = stores.menus.right;
	const leftMenu = stores.menus.left;
    const themeMenu = stores.menus.theme;

    const foldersAvailable = stores.pages.folders;
    const mysharesAvailable = stores.pages.myshares;
    const sharedAvailable = stores.pages.shared;
    const adminAvailable = stores.pages.admin;

    async function logout () {
        let res = await request("user/logout");
        if(res.ok) goToPage("login", true);
    }

    async function init() {
        // available options in right menu
        await request("basedirs").then(async res => {
            if(!res.ok) return;
            $foldersAvailable = await res.json().then(basedirs => basedirs.length > 0);
        });

        await request("shares").then(async res => {
            if(!res.ok) return;
            await res.json().then(shares => {
                $mysharesAvailable = shares.my.length > 0;
                $sharedAvailable = shares.shared.length > 0;
            })
        });
        
        await request("user").then(async res => {
            if(!res.ok) return;
            $adminAvailable = await res.json().then(user => user.admin);
        });
    }

    function closeOtherMenus() { $leftMenu = false; $themeMenu = false; }
    function hideMenu() { setTimeout(() => $active = true, 50) }

    init();

    $active = true;
    $: $location, (() => { currentPage = getCurrentPage(); init(); })();
    $: $notify, (() => {
        if($notify?.kind == "basedir" || $notify?.kind == "share") init();
    })();

</script>

{#if ["folders", "myshares", "shared", "settings", "admin"].includes(currentPage)}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="relative">
    <button class="btn btn-ghost btn-circle" on:click={() => {$active = !$active; closeOtherMenus(); }}>
        <SwapLogo iconoff="x" iconon={(() => {
            switch(currentPage) {
                case "folders": return "folder";
                case "myshares": return "share2";
                case "shared": return "users";
                case "settings": return "gear";
                case "admin": return "pc";
            }
        })()} bind:bind={$active} disabled={true}/>
    </button>

    <ul class={`p-2 shadow-xl menu menu-lg font-normal text-base bg-base-100 z-30 absolute right-0 top-20 rounded-box w-64 transition-transform ease-in-out duration-500 transform-gpu will-change-transform origin-top-right ${!$active ? "rotate-0 translate-y-0" : "-rotate-180 -translate-y-20"}`}>
        {#if $foldersAvailable}
        <li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a on:click={() => { goToPage("folders"); hideMenu(); }}>
                <Icons icon="folder"/>
                Folders
            </a>
        </li>
        {/if}
        {#if $mysharesAvailable}
        <li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a on:click={() => { goToPage("myshares"); hideMenu(); }}>
                <Icons icon="share2"/>
                My Shares
            </a>
        </li>
        {/if}
        {#if $sharedAvailable}
        <li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a on:click={() => { goToPage("shared"); hideMenu(); }}>
                <Icons icon="share"/>
                Shared with me
            </a>
        </li>
        {/if}
        <li>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-missing-attribute -->
            <a on:click={() => { goToPage("settings"); hideMenu(); }}>
                <Icons icon="gear"/>
                Settings
            </a>
        </li>
        {#if $adminAvailable}
        <li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a on:click={() => { goToPage("admin"); hideMenu(); }}>
                <Icons icon="pc"/>
                Admin
            </a>
        </li>
        {/if}
        <li>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-missing-attribute -->
            <a class="text-error" on:click={logout}>
                <Icons icon="logout"/>
                Logout
            </a>
        </li>
    </ul>
</div>

{/if}