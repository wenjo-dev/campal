<script>
    import Icons from "../Basic/Icons.svelte";
    import { request, stores } from "../../helper";
    const notify = stores.notify;

    let share;

    let modal;
    export const open = (s) => {
        share = s;
        console.log(s)
        modal.showModal();
    }

    async function confirm() {
        let res = await request(`share/${share.id}`, "delete");
        if(!res.ok) { return; }
        $notify = {action: "deleted", kind: "share"};
        modal.close();
    }

    function abort() { modal.close(); }

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box">
        <h3 class="text-md font-mono text-center mt-2">{share?.name}</h3>
        <h3 class="font-bold text-lg text-center mb-7 mt-2">will be deleted from the database.</h3>

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