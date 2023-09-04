<script>
    import Icons from "../Basic/Icons.svelte";

    export let confirmFunction;

    let album;
    let files;

    var modal;
    export const open = (a, f) => {
        album = a;
        files = f;
        modal.showModal();
    }

    async function confirm() {
        confirmFunction();
        modal.close();
    }

    function abort() { modal.close(); }

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box">
        <h3 class="text-md font-mono text-center mt-2">{files.length > 0 ? files.length+" files" : files[0].name}</h3>
        <h3 class="font-bold text-lg text-center mt-2">will be deleted from</h3>
        <h3 class="text-md font-mono text-center mb-7 mt-2">{album.name}</h3>

        <div class="flex justify-between items-center mt-3">
            <button on:click={confirm} class="btn btn-error">
                <Icons icon="trash"/>
                confirm
            </button>

            <button on:click={abort} class="btn">
                <Icons icon="x"/>
                abort
            </button>
        </div>
    </div>
</dialog>