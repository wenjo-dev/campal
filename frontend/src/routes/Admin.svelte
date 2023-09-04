<script>
    import ManageUsers from "../components/Admin/ManageUsers.svelte";
    import SettingsCard from "../components/Basic/SettingsCard.svelte";
    import ManageBasedirs from "../components/Admin/ManageBasedirs.svelte";
    import { request, stores } from "../helper";
    import Icons from "../components/Basic/Icons.svelte";
    import ConfirmCacheClear from "../components/Modals/ConfirmCacheClear.svelte";

    const notify = stores.notify;
    const changeView = stores.options.changeView;
    const share = stores.options.share;
    const download = stores.options.download;

    let stats;

    async function loadStats() {
        let res = await request("admin/stats");
        if(!res.ok) { console.log(res.status); return; }

        stats = await res.json();
    }

    let indexDone = true;

    async function indexAllBasedirs() {
        indexDone= false;
        request("basedirs/index/all").then(res => {
            if(!res.ok) return;
            else indexDone = true;
            loadStats();
        });
    }

    loadStats();
    $changeView = false;
    $share = false;
    $download = false;


    let openConfirmCacheClearModal;

    $: $notify, (() => {
        if($notify?.kind == "basedir" || $notify?.kind == "user" || $notify?.kind == "cache") loadStats();
    })();
</script>


<!-- CONTENT -->
<div class="p-5 text-lg w-full flex justify-center">
    <div class="w-full max-w-lg">
        <SettingsCard name="users" icon="users">
            <ManageUsers/>
        </SettingsCard>

        <SettingsCard name="base directories" icon="folder">
            <ManageBasedirs/>
        </SettingsCard>

        {#if stats}
        <SettingsCard name="stats" icon="database">
            <table class="table table-zebra">
                <tbody>
                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="album"/>
                                <span class="ml-2">images</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {stats.db.images}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="video"/>
                                <span class="ml-2">videos</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {stats.db.videos}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="folder"/>
                                <span class="ml-2">folders</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {stats.db.folders}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="save"/>
                                <span class="ml-2">cumulated size</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {(() => {
                                let size = stats.db.cumulated_size / 1024 / 1024;
                                return "~"+(size > 1024 ? (Math.round(size / 1024 * 100) / 100)+" GB" : (Math.round(size * 100) / 100)+" MB")
                            })()}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="share"/>
                                <span class="ml-2">shares</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {stats.db.shares}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="camera"/>
                                <span class="ml-2">different cameras</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {stats.db.different_cameras} 
                        </td>
                    </tr>

                </tbody>
            </table>

            <button on:click={indexAllBasedirs} class="btn btn-neutral w-full mt-5" disabled={!indexDone}>
                {#if !indexDone}<span class="loading loading-spinner loading-sm"></span>{/if}
                index all basedirs
            </button>
        </SettingsCard>

        <SettingsCard name="cache" icon="database">
            <table class="table table-zebra">
                <tbody>
                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="album"/>
                                <span class="ml-2">elements</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {stats.cache.count}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            <div class="flex items-center justify-start">
                                <Icons icon="save"/>
                                <span class="ml-2">size</span>
                            </div>
                        </th>
                        <td class="text-right font-semibold font-mono">
                            {(() => {
                                let size = stats.cache.size / 1024 / 1024;
                                return "~"+(size > 1024 ? (Math.round(size / 1024 * 100) / 100)+" GB" : (Math.round(size * 100) / 100)+" MB")
                            })()}
                        </td>
                    </tr>
                </tbody>
            </table>
            <button on:click={openConfirmCacheClearModal} class="btn btn-error w-full mt-5">clear cache</button>
        </SettingsCard>
        {/if}
    </div>
</div>


<ConfirmCacheClear bind:open={openConfirmCacheClearModal}/>