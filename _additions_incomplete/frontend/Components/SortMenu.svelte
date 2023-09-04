{#if $sort?.options && $sort.options.length > 0}
        <div class="mt-2 flex flex-col outline outline-1 rounded-lg p-4">
            <div class="flex items-center justify-start mb-4 w-full">
                <Icons icon="sort"/>
                <h3 class="text-sm font-semibold uppercase ml-2">sort by</h3>
            </div>
            {#each $sort.options as option}
            <div class="w-full flex items-center justify-start mb-2" on:click={() => { $sort.active = option; $sort = $sort; }}>
                <input type="radio" class="radio" checked={option == $sort?.active} />
                <span class="ml-2 text-sm cursor-pointer">{option}</span>
            </div>
            {/each}
            <label class="label cursor-pointer w-full flex items-center justify-end mt-0">
                <span class="label-text text-xs font-semibold">
                    <span class={$sort?.asc ? "opacity-50" : "opacity-100"}>desc</span> / 
                    <span class={$sort?.asc ? "opacity-100" : "opacity-50"}>asc</span>
                </span> 
                <input type="checkbox" class="toggle ml-2" bind:checked={$sort.asc} />
            </label>
        </div>
{/if}