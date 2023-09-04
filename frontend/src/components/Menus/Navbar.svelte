<script>
	import { getCurrentPage, stores } from "../../helper";
	import { location } from "svelte-spa-router";
	import RightMenu from "./RightMenu.svelte";
    import ToolMenu from "./ToolMenu.svelte";
	const downloadMenu = stores.menus.download;
	const rightMenu = stores.menus.right;
	const themeMenu = stores.menus.theme;

	var currentPage;

	let scrolled = false;
    window.addEventListener("scroll", (e) => {
        scrolled = window.scrollY > 100;
    })
	function scrollToTop() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

	$: $location, (() => currentPage = getCurrentPage())();
</script>

<div class={`sticky w-full -top-px z-30 p-2 touch-none bg-base-100 transition-all duration-500 ease-in-out ${scrolled ? "shadow-xl" : "shadow-none"} ${$downloadMenu || !$rightMenu || $themeMenu ? "opacity-100" : "opacity-95"}`}>
	<div class="grid grid-cols-3 w-full">
		<div class="flex items-center justify-start">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-missing-attribute -->
			<a on:click={() => {$downloadMenu = false; $rightMenu = true; scrollToTop();}} class="text-lg font-bold cursor-pointer md:hidden ml-2 p-2 text-secondary">CP</a>
		</div>
		  
		<div class="flex justify-center items-center h-16">
			<div class="md:hidden">
				<ToolMenu/>
			</div>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-missing-attribute -->
			<a on:click={() => {$downloadMenu = false; $rightMenu = true; scrollToTop();}} class="text-xl font-bold cursor-pointer hidden md:flex">CamPal</a>
		</div>

		<div class="flex items-center justify-end md:row-span-5">
			<div class="hidden md:block">
				<ToolMenu/>
			</div>
			<div class="ml-2"><RightMenu/></div>
		</div>
			
	</div>
</div>