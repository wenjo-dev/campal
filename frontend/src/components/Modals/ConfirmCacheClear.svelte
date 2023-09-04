<script>
    import { request, stores } from "../../helper.js";
    import Icons from "../Basic/Icons.svelte";
    const notify = stores.notify;

    let modal;
    export const open = () => {
        modal.showModal();
    }

    async function confirm() {
        let res = await request("admin/clearcache");
        if(!res.ok) { console.log(res.status); return; }

        $notify = {action: "cleared", kind: "cache"}
        modal.close();
    }

    function abort() { modal.close(); }

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg text-center mb-7 mt-2">all preview files will be purged.</h3>

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