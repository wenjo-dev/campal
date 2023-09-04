<script>
    import { goToPage, request } from "../helper";

    async function init() {
        let folders = await request("basedirs").then(async res => {
            if(!res.ok) return false;
            return await res.json().then(basedirs => basedirs.length > 0);
        });
        if(folders) { goToPage("folders", true); return; }

        goToPage("shared", true);
    }

    init();
</script>