<script>
    import { request, goToPage } from "../helper";
    import { themeChange } from "theme-change";
	import { onMount } from "svelte";
    import EditValue from "../components/Basic/EditValue.svelte";
    import SettingsCard from "../components/Basic/SettingsCard.svelte";
    import ChangePassword from "../components/Modals/ChangePassword.svelte";
    import Icons from "../components/Basic/Icons.svelte";

    let user;

    onMount(() => { themeChange(false); });

    const menuEntries = [{
        name: "Theme",
        id: "theme",
        icon: "theme"
    },{
        name: "Personal Info",
        id: "personal",
        icon: "user"
    }]

    async function getUserInfo() {
        let res = await request("user");
        if(!res.ok) { goToPage("login", true); return; }

        user = await res.json();
    }

    const setUsername = async (username) => {
        let res = await request("user", "put", {name: username});
        if(res.ok) getUserInfo();
    }

    const setFullName = async (full_name) => {
        let res = await request("user", "put", {full_name: full_name});
        if(res.ok) getUserInfo();
    }

    var openChangePasswordModal;

    getUserInfo();
</script>

<div class="p-5 text-lg w-full flex justify-center">
    <div class="w-full max-w-lg">

        <SettingsCard name="Personal Info" icon="user">
            {#await user}
                <span class="loading loading-dots"></span>
            {:then}
                <EditValue value={user?.name} name="username" apply={(val) => setUsername(val)} update={getUserInfo} />
                <EditValue value={user?.full_name} name="full name" apply={(val) => setFullName(val)} update={getUserInfo} />
                <button on:click={openChangePasswordModal} class="btn w-full mt-5"><Icons icon="key"/>change password</button>
            {/await}
            <ChangePassword bind:open={openChangePasswordModal}/>
        </SettingsCard>

    </div>
</div>