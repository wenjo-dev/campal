<script>
    import { request, stores, goToPage } from "../../helper";
    import AddUser from "../Modals/AddUser.svelte";
    import EditUser from "../Modals/EditUser.svelte";
    import Icons from "../Basic/Icons.svelte";
    const notify = stores.notify;

    let users = [];
    let currentUser;

    async function update() {
        let res = await request("users");
        if(!res.ok) { goToPage("login", true); return; }
        users = await res.json();

        res = await request("user");
        if(!res.ok) { goToPage("login", true); return; };
        currentUser = await res.json();
    }

    update();

    let openAddUserModal;
    let openEditUserModal;

    $: $notify, (() => {
        if($notify?.kind == "user") update();
    })();
</script>


<table class="table">
    <thead>
        <tr>
            <th>username</th>
            <th>full name</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        {#each users as user}
            <tr class={user?.id == currentUser?.id ? "bg-base-200" : ""}>
                <td>{user?.name}</td>
                <td>{(user?.full_name && user.full_name != null) ? user.full_name : ""}</td>
                <td class="text-right">
                    {#if user?.id != currentUser?.id}
                    <button on:click={() => openEditUserModal(user?.id) } class="btn btn-neutral">
                        <Icons icon="edit"/>
                    </button>
                    {/if}
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<button class="btn btn-neutral w-full mt-5" on:click={openAddUserModal}>
    <Icons icon="adduser"/>
    add user
</button>

<AddUser bind:open={openAddUserModal} />
<EditUser bind:open={openEditUserModal} />