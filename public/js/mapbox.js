/* eslint-disable */

export const displayMap = (locations) => {
  document.addEventListener("DOMContentLoaded", function () {
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js";
    script.nonce = document
      .querySelector("script[nonce]")
      .getAttribute("nonce");
    script.async = true;
    script.onload = initializeMap;
    document.head.appendChild(script);

    function initializeMap() {
      mapboxgl.accessToken =
        "pk.eyJ1IjoidGFpbW9vcnJhbmEiLCJhIjoiY2xtdWlxbGVrMGU0ZzJzdnp3ODh6cTVvdiJ9.1g5xXvNpT75NryDweeuLGg";

      var map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/taimoorrana/clmt3h3ec02dt01pbec460oam/draft",
        scrollZoom: false,
        //   center: [-118.113491, 34.111745],
        //   zoom: 10,
        //   interactive: false,
      });

      const bounds = new mapboxgl.LngLatBounds();

      locations.forEach((loc) => {
        // Create marker
        const el = document.createElement("div");
        el.className = "marker";

        // Add marker
        new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(loc.coordinates)
          .addTo(map);

        // Add Popup
        new mapboxgl.Popup({
          offset: 30,
        })
          .setLngLat(loc.coordinates)
          .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
          .addTo(map);

        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
      });

      map.fitBounds(bounds, {
        padding: {
          top: 200,
          bottom: 150,
          left: 100,
          right: 100,
        },
      });
    }
  });
};
