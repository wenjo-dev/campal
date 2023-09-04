<script>
    import { themeChange } from "theme-change";
    import { stores } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    import { onMount } from "svelte";

    onMount(() => themeChange(false));

    const active = stores.menus.theme;
    const rightMenu = stores.menus.right;
	const downloadMenu = stores.menus.download;

    $active = false;
    let inactive = !$active;
    $: inactive, (() => $active = !inactive)();

</script>

<div class="relative">
    <button on:click={() => { $active = !$active; $rightMenu = true; $downloadMenu = false; }} class="btn btn-ghost btn-circle"><Icons icon="theme"/></button>

    <ul class={`p-2 shadow-xl menu menu-md bg-base-100 -z-10 absolute right-0 top-20 rounded-box w-52 transition-transform ease-in-out duration-500 transform-gpu will-change-transform origin-top ${$active ? "scale-y-100": "scale-y-0"}`}>
        {#each ["auto light/dark", "bumblebee", "garden", "pastel", "retro", "lofi", "black", "dracula", "wireframe"] as themeName}
        <li><button on:click={() => $active = false} data-set-theme={themeName} data-act-class="ACTIVECLASS">{themeName}</button></li>
        {/each}
    </ul>
</div>