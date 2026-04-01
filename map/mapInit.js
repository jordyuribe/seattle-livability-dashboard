export function initMap() { // export allows for other files to use this
    const map = new maplibregl.Map({ // creates the new maLibre instance
        container: 'map', // renders map into the map portion in html
        style: {
            version: 8,
            sources: { // where the mpa is coming from
                'osm': {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors'
                }
            },
            layers: [{ // how the data wil be dispalyed
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm'
            }]
        },
        center: [-122.335, 47.610], // Seattle coordinates
        zoom: 11
    });
    return map;
}