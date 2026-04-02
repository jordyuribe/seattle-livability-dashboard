import { initTooltip, showTooltip, hideTooltip } from '../components/tooltip.js';
import { pm25ToAQI } from '../data/scoreEngine.js';


// Stores the GeoJSON in memory so we can update it without reloading
let neighborhoodData = null;

export function loadChoropleth(map) {
  map.on('load', async () => {

    // Load the GeoJSON file
    const response = await fetch('./assets/seattle_neighborhoods.geojson');
    neighborhoodData = await response.json();

    // Add it as a MapLibre source
    map.addSource('neighborhoods', {
      type: 'geojson',
      data: neighborhoodData
    });

    // Fill layer — color driven by the 'livability_score' property
    // we inject into each feature below
    map.addLayer({
      id: 'neighborhood-fill',
      type: 'fill',
      source: 'neighborhoods',
      paint: {
        'fill-color': [
          'case',
          // If no score data, show gray
          ['==', ['get', 'livability_score'], null],
         '#cccccc',
          ['!', ['has', 'livability_score']],
          '#cccccc',
          // Otherwise interpolate color based on score
          [
            'interpolate', ['linear'],
            ['get', 'livability_score'],
            0,  '#dc2626',   // red — poor
            40, '#f97316',   // orange
            55, '#fbbf24',   // amber
            70, '#4ade80',   // light green
            90, '#15803d'    // dark green — excellent
          ]
        ],
        'fill-opacity': 0.6
      }
    });

    // White outlines between neighborhoods
    map.addLayer({
      id: 'neighborhood-outline',
      type: 'line',
      source: 'neighborhoods',
      paint: {
        'line-color': '#ffffff',
        'line-width': 1.5
      }
    });

    // ── AIR QUALITY SENSOR LAYER ──
    map.addSource('air-quality-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: 'air-quality-layer',
      type: 'circle',
      source: 'air-quality-points',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'interpolate', ['linear'], ['get', 'aqi'],
          0,   '#15803d',
          50,  '#fbbf24',
          100, '#f97316',
          150, '#dc2626'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9
      }
    });

    // ── NOISE SENSOR LAYER ──
    map.addSource('noise-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: 'noise-layer',
      type: 'circle',
      source: 'noise-points',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'interpolate', ['linear'], ['get', 'db'],
          40, '#15803d',
          53, '#fbbf24',
          65, '#f97316',
          75, '#dc2626'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9
      }
    });

    // ── GREEN SPACE LAYER ── separate fill layer
    map.addLayer({
      id: 'green-space-layer',
      type: 'fill',
      source: 'neighborhoods',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': [
          'case',
          ['!', ['has', 'green_pct']],
          '#cccccc',
          ['==', ['get', 'green_pct'], null],
          '#cccccc',
          [
            'interpolate', ['linear'],
            ['get', 'green_pct'],
            0,   '#f7fcf5',
            25,  '#c7e9c0',
            50,  '#74c476',
            75,  '#238b45',
            100, '#00441b'
          ]
        ],
        'fill-opacity': 0.7
      }
    });

     // ── TOOLTIP ──
    const tooltip = initTooltip();

    // Show tooltip on hover
    map.on('mousemove', 'neighborhood-fill', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const props = e.features[0].properties;
      showTooltip(tooltip, e.point, props);
    });

    // Hide tooltip when leaving a neighborhood
    map.on('mouseleave', 'neighborhood-fill', () => {
      map.getCanvas().style.cursor = '';
      hideTooltip(tooltip);
    });

  });
}

// Called from main.js after scores are computed
// Injects livability scores into GeoJSON properties and updates the map
export function updateChoropleth(map, scores) {

  // Wait until the source exists on the map
  if (!map.getSource('neighborhoods') || !neighborhoodData) return;

  // Inject scores into each neighborhood feature's properties
  const updatedGeoJSON = {
    ...neighborhoodData,
    features: neighborhoodData.features.map(feature => {
      const name = feature.properties.S_HOOD;
      const data = scores[name];

      return {
        ...feature,
        properties: {
          ...feature.properties,
          livability_score: data ? data.score : null,
          aqi: data ? data.aqi : null,
          green_pct: data ? data.greenPct : null,
          noise_db: data ? data.noiseDb : null
        }
      };
    })
  };

  // Update the map source — MapLibre re-renders automatically
  map.getSource('neighborhoods').setData(updatedGeoJSON);
}

export function updateSensorLayers(map, sensors, noiseSensors) {

  // Air quality sensor dots — colored by AQI
  if (map.getSource('air-quality-points') && sensors) {
    map.getSource('air-quality-points').setData({
      type: 'FeatureCollection',
      features: sensors
        .filter(s => s['pm2.5_atm'] <= 200) // filter bad sensors
        .map(s => ({
          type: 'Feature',
          properties: {
            name: s.name,
            aqi: pm25ToAQI(s['pm2.5_atm'])
          },
          geometry: {
            type: 'Point',
            coordinates: [s.longitude, s.latitude]
          }
        }))
    });
  }

  // Noise sensor dots — colored by dB
  if (map.getSource('noise-points') && noiseSensors) {
    map.getSource('noise-points').setData({
      type: 'FeatureCollection',
      features: noiseSensors.map(s => ({
        type: 'Feature',
        properties: { name: s.name, db: s.db },
        geometry: {
          type: 'Point',
          coordinates: [s.longitude, s.latitude]
        }
      }))
    });
  }
}

