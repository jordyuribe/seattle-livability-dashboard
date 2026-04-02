export function initMap() {
  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        'carto-base': {
          type: 'raster',
          tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© CartoDB © OpenStreetMap contributors'
        },
      },
      layers: [
        {
          id: 'carto-base-layer',
          type: 'raster',
          source: 'carto-base'
        },
      ]
    },
    center: [-122.335, 47.610],
    zoom: 11
  });

  return map;
}