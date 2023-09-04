<script>
    import { request } from "../../helper";
    import Icons from "../Basic/Icons.svelte";

    var modal;
    export const open = () => modal.showModal();

    async function confirm() {
        if(pw.new == "") { fail.new = true; return; }
        else if(pw.new != pw.confirm) { fail.new = true; pw.confirm = ""; return; }

        fail.new = false;

        let res = await request("user", "put", {password: pw.new, currentPassword: pw.current});
        if(!res.ok) {
            if(res.status == 400) {
                fail.current = true;
                pw.current = "";
            }
            return;
        }
        reset();
        modal.close();
    }

    function abort() {
        reset();
        modal.close();
    }

    function handleKey(e) {
        if(e.keyCode == 13) {
            e.preventDefault();
            confirm();
        }
    }

    function reset() {
        pw = {current: "", new: "", confirm: ""}
        fail = {current: false, new: false};
    }

    let pw = {current: "", new: "", confirm: ""}
    let fail = {current: false, new: false};

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box" on:keydown={handleKey}>

        <h3 class="font-bold text-lg text-center mb-5">change password</h3>

        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="font-medium block mb-1">current</label>
        <input bind:value={pw.current} placeholder="enter current password" type="password" autocomplete="off" class="input w-full input-bordered" />

        {#if fail.current}
            <div class="alert alert-error mt-2">
                <span>current password wrong</span>
            </div>
        {/if}

        <div class="divider mb-3 mt-5"/>

        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="font-medium block mb-1">new</label>
        <input bind:value={pw.new} type="password" placeholder="enter new password" autocomplete="off" class="input w-full input-bordered" />
        {#if pw.new != ""}<input bind:value={pw.confirm} type="password" placeholder="confirm password" autocomplete="off" class="input w-full input-bordered mt-2" />{/if}

        {#if fail.new}
            <div class="alert alert-error mt-2">
                <span>entered nothing or not the same</span>
            </div>
        {/if}
        

        <div class="flex justify-between items-center mt-3">
            <button on:click={confirm} class="btn btn-neutral">
                <Icons icon="check"/>
                confirm
            </button>

            <button on:click={abort} class="btn">
                <Icons icon="x"/>
                abort
            </button>
        </div>
    </div>
</dialog>