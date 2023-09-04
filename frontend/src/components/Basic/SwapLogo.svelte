<script>
    import Icons from "./Icons.svelte";
    export var iconon, iconoff, bind, disabled;

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<label class="swap swap-rotate">
    <input disabled={disabled} type="checkbox" bind:checked={bind} class="hidden" />
    <div class="swap-off"><Icons icon={iconoff}/></div>
    <div class="swap-on"><Icons icon={iconon}/></div>
</label>