export function loadChoropleth(map) {
    map.on("load", () => {

        // load neighborhood boundaries
        map.addSource('neighborhoods', {
            type: 'geojson',
            data: './assets/seattle_neighborhoods.geojson'
        });

        // fill layer - this is the choropleth
        map.addLayer ({
            id: 'neighborhood-fill',
            type: 'fill',
            source: 'neighborhoods',
            paint: {
                'fill-color': '#2a7d6f',
                'fill-opacity': 0.4
            }
        });

        // outline the layer
        map.addLayer ({
            id: 'neighborhood-outline',
            type: 'line',
            source: 'neighborhoods',
            paint: {
                'line-color': '#ffffff',
                'line-width': 1.5
            }
        });
    });
}