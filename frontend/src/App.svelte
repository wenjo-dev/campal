<script>
    import Navbar from "./components/Menus/Navbar.svelte";

    import Router from "svelte-spa-router";
    import NotFound from "./routes/NotFound.svelte";
    import Share from "./routes/Share.svelte";
    import Folders from "./routes/Folders.svelte";
    import Init from "./routes/Init.svelte";
    import MyShares from "./routes/MyShares.svelte";
    import Shared from "./routes/Shared.svelte";
    import UserLogin from "./routes/UserLogin.svelte";
    import Settings from "./routes/Settings.svelte";
    import Admin from "./routes/Admin.svelte";

    let routes = {
        "/": Init,
        "/folders/:path?": Folders,
        "/myshares/:share?/:path?": MyShares,
        "/shared/:share?/:path?": Shared,
        "/settings": Settings,
        "/admin": Admin,
        "/login": UserLogin,
        "/share/:url?/:path?": Share,
        "*": NotFound
    }

</script>

<main>
    <div class="w-full flex justify-center overflow-x-clip">
    <div class="max-w-[120rem] w-full relative">

    <Navbar/>

    <Router {routes}/>

    </div>
    </div>
</main>