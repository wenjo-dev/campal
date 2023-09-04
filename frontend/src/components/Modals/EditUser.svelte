<script>
    import { request, stores, goToPage, enableDocScroll, disableDocScroll } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    const notify = stores.notify;

    let modal;

    export const open = async id => {
        reset();
        await load(id);
        modal.showModal();
        disableDocScroll();
    }

    let user;
    let newValues = {
        name: "",
        full_name: "",
        admin: false,
        pw: { new: "", confirm: "" }
    }
    
    let tryDelete = false;
    let fail = {name: false, pw: false}

    function reset() {
        newValues = {
            name: "",
            full_name: "",
            admin: false,
            pw: { new: "", confirm: "" }
        }
        tryDelete = false;
        fail = {name: false, pw: false}
    }

    async function load(id) {
        let res = await request(`user?id=${id}`);
        if(!res.ok) {
            if(res.status == 400) goToPage("login", true);
            return;
        }
        user = await res.json();
        newValues.admin = user.admin;
    }

    async function confirm() {
        if(tryDelete) {
            let res = await request(`user?id=${user?.id}`, "delete");
            if(!res.ok) {
                if(res.status == 403) goToPage("login", true);
                return;
            }
            $notify = {action: "deleted", kind: "user", id: user.id}
        } else {
            if(newValues.pw.new != "" && newValues.pw.new != newValues.pw.confirm) { fail.pw = true; return; }
            fail.pw = false;

            let res = await request(`user?id=${user?.id}`, "put", {
                ...(newValues.name != "" && {name: newValues.name}),
                ...(newValues.full_name != "" && {full_name: newValues.full_name}),
                ...(newValues.pw.new != "" && {password: newValues.pw.new}),
                admin: newValues.admin
            })
            if(!res.ok) {
                if(res.status == 409) fail.name = true;
                return;
            }
            $notify = {action: "updated", kind: "user", id: user.id}
        }

        modal.close();
        enableDocScroll();
        return;
    }

    function abort() {
        modal.close();
        enableDocScroll();
    }

    function handleKey(e) {
        if(e.keyCode == 13) {
            e.preventDefault();
            confirm();
        }
    }

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box" on:keydown={handleKey}>

        {#if !tryDelete}

            <h3 class="font-bold text-lg text-center mb-5">edit user: {user?.name}</h3>

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="font-medium block mb-1">username</label>
            <input bind:value={newValues.name} type="text" placeholder={user?.name} autocomplete="off" class="input w-full input-bordered" />

            {#if fail.name}
                <div class="alert alert-error mt-2">
                    <span>username already exists</span>
                </div>
            {/if}

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="font-medium block mb-1 mt-3">full name</label>
            <input bind:value={newValues.full_name} placeholder={user?.full_name} type="text" autocomplete="off" class="input w-full input-bordered" />

            <label class="label cursor-pointer mt-3">
                <span class="label-text text-xl font-medium">admin</span> 
                <input type="checkbox" class="toggle" bind:checked={newValues.admin} />
            </label>

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="font-medium block mb-1 mt-3">password</label>
            <input bind:value={newValues.pw.new} type="password" placeholder="enter new password" autocomplete="off" class="input w-full input-bordered" />
            {#if newValues.pw.new != ""}<input bind:value={newValues.pw.confirm} type="password" placeholder="confirm password" autocomplete="off" class="input w-full input-bordered mt-2" />{/if}


            {#if fail.pw}
                <div class="alert alert-error mt-2">
                    <span>not the same</span>
                </div>
            {/if}

            <button on:click={() => { tryDelete = true; }} class="btn btn-error w-full mt-5">
                <Icons icon="trash"/>
                delete user
            </button>

        {:else}
            <div class="text-center text-error w-full rounded p-5">user <span class="font-bold">{user?.name}</span> will be deleted</div>
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