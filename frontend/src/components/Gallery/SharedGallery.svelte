<script>
    import { compare } from "../../helper";
    import Preview from "./Preview.svelte";
    import SwapLogo from "../Basic/SwapLogo.svelte";
    import Icons from "../Basic/Icons.svelte";

    export let shares;
    export let view;

    let sortedBy;
    let asc = true;

    function sort(by) {
        if(by == sortedBy) asc = !asc;
        sortedBy = by;

        let temp = shares;
        switch(by) {
            case "timestamp": temp.sort((a, b) => compare(a.timestamp, b.timestamp, asc)); break;
            case "name": temp.sort((a, b) => compare(a.name, b.name, asc)); break;
            case "user": temp.sort((a, b) => compare(a.username, b.username, asc)); break;
        }
        shares = temp;
    }

</script>

<div class="divider mx-2">
    {shares.length} SHARE{#if shares.length > 1}S{/if}
</div>

<!-- grid view -->
{#if view == "grid"}

<div class="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-11 mb-12 mx-1">
    {#each shares as share (share)}
        <Preview element={share} kind="share" view="grid"/>
    {/each}
</div>

<!-- list view -->
{:else if view == "list"}

<table class="table cursor-pointer">
    <thead class="shadow-sm bg-base-100">
        <tr>
            <th></th> <!-- thumbnail -->
            <th on:click={() => sort("name")}><div class="flex justify-start items-center">name {#if sortedBy == "name"}<span class="ml-2"><SwapLogo iconon="arrow_up" iconoff="arrow_down" disabled="true" bind:bind={asc} /></span>{/if}</div></th>
            <th on:click={() => sort("timestamp")}><div class="flex justify-start items-center">last modified {#if sortedBy == "timestamp"}<span class="ml-2"><SwapLogo iconon="arrow_up" iconoff="arrow_down" disabled="true" bind:bind={asc} /></span>{/if}</div></th>
            <th class="hidden sm:table-cell" on:click={() => sort("user")}><div class="flex justify-start items-center"><Icons icon="user"/> {#if sortedBy == "user"}<span class="ml-2"><SwapLogo iconon="arrow_up" iconoff="arrow_down" disabled="true" bind:bind={asc} /></span>{/if}</div></th>
        </tr>
    </thead>
    <tbody>
        {#each shares as share (share)}
            <Preview element={share} kind="share" view="list" shared=true />
        {/each}
    </tbody>
</table>

{/if}       