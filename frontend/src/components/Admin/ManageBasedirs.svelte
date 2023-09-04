<script>
    import { request, stores, goToPage } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    import AddBasedir from "../Modals/AddBasedir.svelte";
    import ConfirmBasedirDelete from "../Modals/ConfirmBasedirDelete.svelte";
    const notify = stores.notify;
    
    let users = [];
    let loaded = false;


    async function update() {
        loaded = false;

        let res = await request("basedirs/all");
        if(!res.ok) { goToPage("login", true); return; };

        let basedirs = await res.json();

        users = [];
        res = await request("users");
        if(!res.ok) { goToPage("login", true); return; };

        for(let user of await res.json()) {
            let dirs = basedirs.filter(e => e.user_id == user.id);
            if(dirs.length > 0) users = [...users, {name: user.name, full_name: user.full_name, dirs: dirs}]
        }
        loaded = true;
    }

    update();

    let openAddBasedirModal;
    let confirmDeleteModal;

    $: $notify, (() => {
        if($notify?.kind == "user" || $notify?.kind == "basedir") update();
    })();
</script>

{#if !loaded}
    <div class="w-full h-96 flex justify-center items-center">
        <span class="loading loading-dots loading-lg"></span>
    </div>
{:else}

{#each users as user (user)}
<h3 class="text-lg text-center font-semibold">{user.name}{user.full_name && user.full_name.length > 0 ? " ("+user.full_name+")" : ""}</h3>
<table class="table mb-5">
    <thead><tr><th>path</th><th></th></tr></thead>
    <tbody>
        {#each user.dirs as dir (dir)}
            <tr>
                <td class="break-all font-mono">{dir.path}</td>
                <td class="text-right">
                    <button on:click={() => confirmDeleteModal(dir)} class="btn btn-error">
                        <Icons icon="trash"/>
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>
{/each}

<button class="btn btn-neutral w-full mt-5" on:click={openAddBasedirModal}>
    <Icons icon="addfolder"/>
    add base directory
</button>

<AddBasedir bind:open={openAddBasedirModal} />
<ConfirmBasedirDelete bind:open={confirmDeleteModal} />

{/if}