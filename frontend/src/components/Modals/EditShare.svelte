<script>
    import { request, timePickPresets, timeToShortLocaleISO, stores, enableDocScroll, disableDocScroll } from "../../helper";
    import Icons from "../Basic/Icons.svelte";
    import ConfirmShareDelete from "./ConfirmShareDelete.svelte";
    const notify = stores.notify;


    let modal;
    let loaded = false;
    let users = [];
    let folder;
    let id;

    let share = {
        name: {
            value: undefined,
            placeholder: undefined
        },
        description: undefined,
        expires: {
            active: false,
            value: timePickPresets(8).preset
        },
        public: {
            active: undefined,
            url: {
                value: undefined,
                placeholder: undefined,
                check: undefined
            },
            protected: {
                active: undefined,
                password: undefined,
                placeholder: undefined
            }
        },
        thumbnail: undefined,
        withUsers: undefined
    }

    export const open = async (shareId) => {
        reset();
        let res = await request(`share/info/${shareId}`);
        if(!res.ok) { return; }
        let temp = await res.json();
        
        id = temp.id;
        share.name.value = temp.name;
        share.description = temp.description;
        if(temp.expires) { share.expires.active = true; share.expires.value = timeToShortLocaleISO(temp.expires); }
        share.thumbnail = temp.thumbnail;
        if(temp.url) { share.public.active = true; share.public.url.value = temp.url; share.public.url.check = true; }
        if(temp.pw) { share.public.protected.active = true; share.public.protected.placeholder = "keep existing"}

        res = await request("users");
        if(!res.ok) { console.log(res.status); return; }
        users = await res.json();

        res = await request("user");
        if(!res.ok) { console.log(res.status); return; }
        let currentUserId = await res.json().then(res => res?.id);

        users = users.filter(e => e.id != currentUserId);
        users = users.map(e => { if(temp.users.includes(e.id)) e.selected = true; return e; })
        if(users.filter(e => e.selected).length > 0) share.withUsers = true;

        res = await request(`folder/info/${temp.folder_id}`)
        if(!res.ok) { console.log(res.status); return; }
        folder = await res.json();

        updateFields();
        loaded = true;
        modal.showModal();
    }

    function updateFields() {
        if(!share.name.value || share.name.value == "") share.name.placeholder = folder?.name;
        else share.name.placeholder = share.name.value;
    }

    async function confirm() {
        let res = await request(`share/${id}`, "put", {
            name: (!share.name.value || share.name.value == "" ? share.name.placeholder : share.name.value),
            description: share.description,
            folder_id: folder.id,
            ...(share.thumbnail && {thumbnail: share.thumbnail}),
            ...(share.expires.active && {expires: new Date(share.expires.value).getTime()}),
            ...(share.public.active && {url: share.public.url.value}),
            ...(share.public.protected.active ? {password: share.public.protected.password} : {removepassword: true}),
            ...(share.withUsers && { users: users.filter(e => e.selected).map(e => e.id) })
        })
        if(!res.ok) { return; }

        $notify = {action: "updated", kind: "share", id: id}
        modal.close();
    }

    async function randomUrl() {
        let res = await request("shares/randomurl");
        if(!res.ok) { return; }
        share.public.url.value = await res.text();
        share.public.url.check = true;
    }

    async function checkUrl() {
        let safestring = (!share.public.url.value || share.public.url.value == "" ? share.public.url.placeholder : encodeURIComponent(share.public.url.value));
        let no = -1;
        let ok = false;
        while(!ok) {
            let res = await request(`shares/checkurl/${safestring+(no > 0 ? "-"+no : "")}`)
            ok = res.ok;
            no += 1;
        }
        share.public.url.value = safestring+(no > 0 ? "-"+no : "");
        share.public.url.check = true;
    }

    function reset() {
        loaded = false;
        share = {
            name: {
                value: undefined,
                placeholder: undefined
            },
            description: undefined,
            expires: {
                active: false,
                value: timePickPresets(8).preset
            },
            public: {
                active: undefined,
                url: {
                    value: undefined,
                    placeholder: undefined,
                    check: undefined
                },
                protected: {
                    active: undefined,
                    password: undefined,
                    placeholder: undefined
                }
            },
            thumbnail: undefined,
            withUsers: undefined
        }
    }

    function abort() {
        modal.close();
    }

    let openConfirmDeleteModal;

    $: share.name.value, updateFields();

</script>

<dialog bind:this={modal} class="modal">
    <div class="modal-box">
        {#if !loaded}
            <div class="w-full h-32 flex justify-center items-center">
                <span class="loading loading-dots loading-lg"></span>
            </div>
        {:else}
            <h3 class="font-bold text-md text-center mb-3">share</h3>
            <h3 class="text-md font-mono text-center mb-3">{folder.name}</h3>

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="font-medium block mb-1 mt-3">Name</label>
            <input bind:value={share.name.value} placeholder={folder.name} type="text" autocomplete="off" class="input w-full input-bordered" />

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="font-medium block mb-1 mt-3">Description</label>
            <textarea bind:value={share.description} class="textarea w-full textarea-bordered max-h-96" placeholder="share description"></textarea>

            <div class="divider"></div>

            <!-- public share -->
            <div class="w-full flex justify-between mt-3">
                <div class="flex items-center {!share.public.active ? "opacity-50" : ""}"><Icons icon="world"/><span class="ml-2">public</span></div>
                <input type="checkbox" class="toggle" bind:checked={share.public.active} />
            </div>

            {#if share.public.active}
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="font-medium block mb-1 mt-3">short URL</label>
                <div class="flex">
                    <input on:keydown={() => share.public.url.check = false}  bind:value={share.public.url.value} placeholder={share.public.url.placeholder} type="text" autocomplete="off" class="input w-full input-bordered font-mono" />
                    <button class="btn btn-square ml-1" on:click={randomUrl}><Icons icon="reload"/></button>
                    <button class="btn btn-square ml-1 {share.public.url.check ? "btn-neutral" : ""}" on:click={checkUrl} disabled={share.public.url.check}><Icons icon="check"/></button>
                </div>

                <!-- password protected -->
                <div class="w-full flex justify-between mt-3">
                    <div class="flex items-center {!share.public.protected.active ? "opacity-50" : ""}"><Icons icon="key"/><span class="ml-2">protected</span></div>
                    <input type="checkbox" class="toggle" bind:checked={share.public.protected.active} />
                </div>

                {#if share.public.protected.active}
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label class="font-medium block mb-1 mt-3">Password</label>
                    <input bind:value={share.public.protected.password} placeholder={share.public.protected.placeholder} type="text" autocomplete="off" class="input w-full input-bordered font-mono" />
                {/if}
            {/if}


            {#if users.length > 0}
                <div class="divider"></div>

                <!-- shared with users -->
                <div class="w-full flex justify-between mt-3">
                    <div class="flex items-center {!share.withUsers ? "opacity-50" : ""}"><Icons icon="users"/><span class="ml-2">with users</span></div>
                    <input type="checkbox" class="toggle" bind:checked={share.withUsers} />
                </div>

                {#if share.withUsers}
                    <table class="table mt-3">
                        {#each users as user}
                            <tr class="transition-all ease-in-out cursor-pointer {user?.selected ? "bg-accent text-accent-content" : "md:hover:bg-base-200"}" on:click={() => {
                                if(user?.selected) user.selected = false;
                                else user.selected = true;
                                users = users.map(e => e.id == user.id ? user : e)}}>
                                <td>{user.name}</td>
                                <td>{user.full_name}</td>
                            </tr>
                        {/each}
                    </table>
                {/if}

                <div class="divider"></div>
            {/if}

            <!-- expire date -->
            <div class="w-full flex justify-between mt-3">
                <div class="flex items-center {!share.expires.active ? "opacity-50" : ""}"><Icons icon="calendar"/><span class="ml-2">expire date</span></div>
                <input type="checkbox" class="toggle" bind:checked={share.expires.active} />
            </div>

            {#if share.expires.active}
                <input class="input w-full mt-3 input-bordered" type="datetime-local" min={timePickPresets(8).min} bind:value={share.expires.value} />
            {/if}

            <div class="flex justify-between items-center mt-8">
                <button on:click={confirm} class="btn btn-neutral" disabled={
                    (!share.withUsers && !share.public.active) ||
                    (share.public.active && (!share.public.url.check ||
                    (share.public.protected.active && (!share.public.protected.password || share.public.protected.password == "") && share.public.protected.placeholder != "keep existing")))
                    || (share.withUsers && users.filter(e => e?.selected).length < 1)
                }>
                    <Icons icon="save"/>
                    save
                </button>

                <button on:click={() => openConfirmDeleteModal({name: share.name.value, id: id})} class="btn btn-error">
                    <Icons icon="trash"/>
                    <span class="hidden md:inline">delete</span>
                </button>

                <button on:click={abort} class="btn">
                    <Icons icon="x"/>
                    cancel
                </button>
            </div>
        {/if}
    </div>
</dialog>

<ConfirmShareDelete bind:open={openConfirmDeleteModal}/>