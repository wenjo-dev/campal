<script>
    import { request, urlEncode, stores } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    import Breadcrumbs from "../Basic/Breadcrumbs.svelte";
    const notify = stores.notify;

    let modal;
    export const open = () => {
        reset();
        modal.showModal();
        load();
    }

    let loading = true;
    let path = [];
    let folders = [];
    let users = [];
    let userId = "select user";
    let fail = false;

    async function confirm() {
        if(userId == "select user") {
            fail = true;
            return;
        }
        fail = false;
        let res = await request("basedir", "post", {user_id: userId, path: path});
        if(!res.ok) { return; }
        $notify = {action: "added", kind: "basedir"};
        modal.close();
    }

    function abort() {
        modal.close();
    }

    function handleKey(e) {
        if(e.keyCode == 13) {
            e.preventDefault();
            confirm();
        }
    }

    async function load() {
        loading = true;

        if(users.length < 1) {
            let res = await request("users");
            if(!res.ok) { goToPage("login", true); return; }
            users = await res.json();
        }

        let res = await request(`filesystem/subfolders/${urlEncode(path)}`);
        if(!res.ok) { return; }
        folders = await res.json();
        loading = false;
    }

    async function enterFolder(folder) {
        path = [...path, folder];
        await load();
    }

    async function folderUp() {
        path = path.slice(0, path.length-1)
        await load();
    }

    function reset() {
        path = [];
        folders = [];
        loading = true;
        users = [];
        userId = "select user";
        fail = false;
    }

    $: $notify, (async () => {
        if($notify?.kind == "breadcrumb") {
            path = path.slice(0, $notify.index+1);
            $notify = {};
            await load();
        }
    })();

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box" on:keydown={handleKey}>

        <h3 class="font-bold text-lg text-center mb-5">add base directory</h3>

        <Breadcrumbs bind:breadcrumbs={path}/>

        <div class="w-full max-h-96 overflow-y-auto border border-base-300 rounded-lg mt-2 cursor-pointer">
            {#if loading}
                <div class="w-full h-32 flex justify-center items-center">
                    <span class="loading loading-dots loading-lg"></span>
                </div>
            {:else}
                {#if path.length > 0}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div on:click={folderUp} class="h-12 w-full my-2 flex justify-left items-center pl-4">
                        <Icons icon="back"/>
                        <span class="ml-2">..</span>
                    </div>
                {/if}
                {#each folders as folder, i}
                    <hr class="h-px bg-base-300 border-0">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div on:click={() => enterFolder(folder)} class="h-12 w-full my-2 flex justify-left items-center pl-4">
                        <Icons icon="folder"/>
                        <span class="ml-2">{folder}</span>
                    </div>
                {/each}
            {/if}
        </div>

        <select bind:value={userId} class="select select-bordered w-full mt-2">
            <option disabled selected>select user</option>
            {#each users as user}
                <option value={user.id}>{user.name}{user.full_name && user.full_name.length > 0 ? " ("+user.full_name+")" : ""}</option>
            {/each}
        </select>

        {#if fail}
            <div class="alert alert-error mt-2">
                <span>select user!</span>
            </div>
        {/if}

        <div class="flex justify-between items-center mt-2">
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