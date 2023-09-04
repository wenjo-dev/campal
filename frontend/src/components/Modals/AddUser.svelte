<script>
    import { request, stores } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    const notify = stores.notify;

    let modal;
    export const open = () => modal.showModal();

    let user = {
        name: "",
        full_name: "",
        admin: 0,
        pw: { new: "", confirm: "" }
    }

    let fail = { name: {empty: false, exists: false }, pw: false }

    async function confirm() {
        if(user.pw.new == "" || user.pw.new != user.pw.confirm) {
            fail.pw = true;
            user.pw.confirm = "";
            return;
        }
        fail.pw = false;

        let res = await request("user", "post", {name: user.name, password: user.pw.new, admin: user.admin, full_name: user.full_name});
        if(!res.ok) {
            if(res.status == 409) { fail.name = true; user.name = ""; }
            if(res.status == 403) console.log("forbidden") // no admin
            return;
        }
        $notify = {action: "added", kind: "user"}

        modal.close();
        reset();
    }

    function abort() {
        modal.close();
        reset();
    }

    function handleKey(e) {
        if(e.keyCode == 13) {
            e.preventDefault();
            confirm();
        }
    }

    function reset() {
        user = {
            name: "",
            full_name: "",
            admin: 0,
            pw: { new: "", confirm: "" }
        }
        fail = { name: {empty: false, exists: false }, pw: false }
    }

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box" on:keydown={handleKey}>

        <h3 class="font-bold text-lg text-center mb-5">add user</h3>

        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="font-medium block mb-1">username</label>
        <input bind:value={user.name} placeholder="enter username" type="text" autocomplete="off" class="input w-full input-bordered" />

        {#if fail.name.empty || fail.name.exists}
            <div class="alert alert-error mt-2">
                <span>username {fail.name.empty ? "empty" : "already exists"}</span>
            </div>
        {/if}

        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="font-medium block mb-1 mt-3">full name</label>
        <input bind:value={user.full_name} placeholder="enter full name" type="text" autocomplete="off" class="input w-full input-bordered" />

        <label class="label cursor-pointer mt-2">
            <span class="label-text text-xl font-medium">admin</span> 
            <input type="checkbox" class="toggle" bind:checked={user.admin} />
        </label>

        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="font-medium block mb-1">password</label>
        <input bind:value={user.pw.new} type="password" placeholder="enter new password" autocomplete="off" class="input w-full input-bordered" />
        {#if user.pw.new != ""}<input bind:value={user.pw.confirm} type="password" placeholder="confirm password" autocomplete="off" class="input w-full input-bordered mt-2" />{/if}

        {#if fail.pw}
            <div class="alert alert-error mt-2">
                <span>entered nothing or not the same</span>
            </div>
        {/if}
        

        <div class="flex justify-between items-center mt-5">
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