<script>
    import Icons from "./Icons.svelte";
    export let name;
    export let icon = "";
</script>

<div class="card bg-base-100 shadow-xl p-5 mb-12">
    
    <div class="text-2xl font-bold text-center w-full mb-5 flex justify-center items-center">
        {#if icon != ""}<div class="mr-2"><Icons icon={icon}/></div>{/if}
        <h1 class="text-2xl font-bold">{name}</h1>
    </div>
    <slot/>
</div>