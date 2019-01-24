import { Map, Marker, TileLayer } from 'leaflet/dist/leaflet-src.esm';

/**
 * A map component, using leaflet.
 */
class UiMaps extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.style.display = "block";
        this.style["height"] = "300px";
        this.map = new Map(this, {
            center: [51.505, -0.09],
            zoom: 4,
            trackResize: false
        });
        this.marker = new Marker([51.5, -0.09]).addTo(this.map);
        this.marker.bindPopup("<b>You are here</b>").openPopup();
        this.map.on("click", (e) => {
            this.marker.setLatLng(e.latlng);
            this.dispatchEvent(new CustomEvent("click", {detail: e.latlng}));
        })
        this.tileLayer = new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'}).addTo(this.map);
    }
    disconnectedCallback() {
        if (this.map) this.map.remove();
    }
}

customElements.define('ui-maps', UiMaps);
