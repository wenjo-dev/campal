<script>
    import { request, goToPage, stores } from "../helper";
    const download = stores.options.download; $download = false;
    const changeView = stores.options.changeView; $changeView = false;

    var failed = false;
    let name = "", password = "";

    function login() {
        request("user/login", "post", {name: name, password: password}).then(async res => {
            if(!res.ok) { failed = true; return }
            goToPage("", true);
            failed = false;
        })
    }

    function handleKey(e) {
        if(e.keyCode == 13) login();
    }

    // bg-gradient-to-tr from-base-200 to-base-400
</script>

<div class="flex w-full justify-center">
    <div class="card w-96 m-5 mt-16 md:mt-32 shadow-xl p-6 bg-base-200" on:keydown={handleKey}>
        <h1 class="font-medium text-2xl text-center py-6">Login</h1>
        <!-- svelte-ignore a11y-autofocus -->
        <input bind:value={name} type="text" name="username" placeholder="username" autocomplete="off" autofocus class="input w-full font-mono" />
        <input bind:value={password} type="password" placeholder="password" name="password" autocomplete="off" class="input w-full mt-2" />
        {#if failed}
            <div class="alert alert-error mt-2">
                <span>wrong credentials</span>
            </div>
        {/if}
        <button on:click={login} class="btn btn-neutral mt-6 w-full">Login</button>
    </div>
</div>