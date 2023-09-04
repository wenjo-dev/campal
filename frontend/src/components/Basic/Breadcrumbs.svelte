<script>
	import Icons from "./Icons.svelte";
	import { stores } from "../../helper";
	const notify = stores.notify;

    export let breadcrumbs;

	function click(index) {
		$notify = { action: "clicked", kind: "breadcrumb", index: index};
	}

</script>

{#if breadcrumbs.length > 0}
<div class="text-sm breadcrumbs pl-4 my-1 w-full transition-all ease-in-out h-7 md:h-12 overflow-y-hidden">
	<ul>
		<li>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-missing-attribute -->
			<a on:click={() => click(-1)}><Icons icon="house" size=4 /></a>
		</li>
		{#each breadcrumbs as breadcrumb, i}
			{#if i != breadcrumbs.length-1}
				<li>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-missing-attribute -->
					<a on:click={() => click(i)}>
						<div class="mr-1"><Icons icon="folder" size=4 /></div>
						{breadcrumb}
					</a>
				</li>
			{:else}
				<li>
					<div class="mr-1"><Icons icon="folder" size=4 /></div>
					{breadcrumb}
				</li>
			{/if}
      {/each}
</div>
{/if}