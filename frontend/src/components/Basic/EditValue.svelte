<script>
    import Icons from "./Icons.svelte";

    export var name;
    export var value;
    export var apply;
    export var update;
    export var pw = "false";

    var initialValue = "";
    var disabled = true;

    function reload() {
        initialValue = value;
    }

    function abort() {
        disabled = true;
        value = initialValue;
    }

    async function change() {
        disabled = true;
        initialValue = value;
        await apply(value);
        update();
    }

    function keyPress(e) {
        switch(e.keyCode) {
            case 13:
                change();
                break;
            case 27:
                abort();
                break;
        }
    }

    $: value && reload();

</script>

<label class="font-medium block mb-1 ml-1 mt-2" for="field">
    {name}
</label>

<div class="flex" on:keydown={keyPress}>
    {#if pw == "true"}
    <input disabled={disabled} bind:value={value} type="password" autocomplete="off" class="input w-full input-bordered" name="field" />
    {:else}
    <input disabled={disabled} bind:value={value} type="text" autocomplete="off" class="input w-full input-bordered" name="field" />
    {/if}

    {#if disabled}
        <button on:click={() => { disabled = false; }} class="btn ml-2">
            <Icons icon="edit"/>
            edit
        </button>
    {:else}
        <button on:click={change} class="btn btn-neutral ml-2">
            <Icons icon="check"/>
        </button>
        <button on:click={abort} class="btn ml-2">
            <Icons icon="x"/>
        </button>
    {/if}
</div>