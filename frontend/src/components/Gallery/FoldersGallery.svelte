<script>
    import Preview from "./Preview.svelte";
    import SwapLogo from "../Basic/SwapLogo.svelte";
    import { compare } from "../../helper";

    export var folders;
    export var view;

    var sortedBy;
    var asc = true;

    function sort(by) {
        if(by == sortedBy) asc = !asc;
        sortedBy = by;

        let temp = folders;
        switch(by) {
            case "name": temp.sort((a, b) => compare(a.name, b.name, asc))
        }
        folders = temp;
    }

</script>

{#if folders.length > 0}

<div class="divider mx-2">
    {folders.length} FOLDER{#if folders.length > 1}S{/if}
</div>

<!-- grid view -->
{#if view == "grid"}

<div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-11 mb-12 mx-1">
    {#each folders as folder (folder)}
        <Preview element={folder} kind="folder" view="grid" shared={false}/>
    {/each}
</div>

<!-- list view -->
{:else if view == "list"}

<table class="table cursor-pointer">
    <thead class="shadow-sm bg-base-100">
        <tr>
            <th></th> <!-- thumbnail -->
            <th on:click={() => sort("name")}><div class="flex justify-start items-center">name {#if sortedBy == "name"}<span class="ml-2"><SwapLogo iconon="arrow_up" iconoff="arrow_down" disabled={true} bind:bind={asc} /></span>{/if}</div></th>
        </tr>
    </thead>
    <tbody>
        {#each folders as folder (folder)}
            <Preview element={folder} kind="folder" view="list" shared={false}/>
        {/each}
    </tbody>
</table>


{/if}

{/if}