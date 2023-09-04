<script>
    import { afterUpdate } from "svelte";
    import { onMount } from "svelte";
    import L from "leaflet/dist/leaflet";

    var map;
    var marker;
    export var lat;
    export var lon;

    function init(lat, lon) {
        if (!map) {
            map = L.map("map").setView([lat, lon], 12);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OSM'
            }).addTo(map);
        }
    }

    function addMarker(lat, lon) {
        if(marker != null) map.removeLayer(marker);
        if(lat != null && lon != null) {
            marker = L.marker([lat, lon]).addTo(map);
            map.flyTo([lat, lon], 12);
        }
    }

    function controlDarkMode() {
        let theme = document.documentElement.getAttribute("data-theme");
        let dark = ["dark", "black", "luxury", "dracula", "coffee"];
        if(dark.includes(theme)) try {
            let elements = [ "layer", "control-zoom-in", "control-zoom-out", "control-attribution" ].map(e => document.getElementsByClassName("leaflet-"+e)[0]);
            elements.forEach(e => e.style.filter = "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)");
        } catch(err) {console.log(err)}
    }

    afterUpdate(() => {
        init(lat, lon);
        addMarker(lat, lon);
    });

    onMount(() => setTimeout(controlDarkMode, 1));

</script>

<style>
    @import "leaflet/dist/leaflet.css";
</style>

<div class="h-96" id="map"></div>