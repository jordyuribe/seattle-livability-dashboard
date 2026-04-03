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
          0,   '#7c3aed',   // purple — good
          50,  '#a855f7',   // light purple — moderate
          100, '#f97316',   // orange — unhealthy
          150, '#dc2626'    // red — hazardous
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9
      }
    });

    // ── NOISE SENSOR LAYER ──
    // ── NOISE SENSOR LAYER — buffer circles ──
    map.addSource('noise-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Buffer fill — shows zone of influence
    map.addLayer({
      id: 'noise-buffer-layer',
      type: 'circle',
      source: 'noise-points',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 40,   // at zoom 10 — 40px radius
          13, 80    // at zoom 13 — 80px radius
        ],
        'circle-color': [
          'interpolate', ['linear'], ['get', 'db'],
          40, '#15803d',
          53, '#fbbf24',
          65, '#f97316',
          75, '#dc2626'
        ],
        'circle-opacity': 0.15,
        'circle-stroke-width': 0
      }
    });

    // Center dot — shows exact sensor location
    map.addLayer({
      id: 'noise-layer',
      type: 'circle',
      source: 'noise-points',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': 7,
        'circle-color': [
          'interpolate', ['linear'], ['get', 'db'],
          40, '#15803d',
          53, '#fbbf24',
          65, '#f97316',
          75, '#dc2626'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 1
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

    // ── NOISE SENSOR TOOLTIPS ──
    const noiseTooltip = document.createElement('div');
    noiseTooltip.style.cssText = `
      position: absolute;
      background: white;
      border: 0.5px solid #e8e6e0;
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 20;
      min-width: 160px;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
    `;
    document.querySelector('.map-wrap').appendChild(noiseTooltip);

    map.on('mousemove', 'noise-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const props = e.features[0].properties;
      const dbColor = props.db <= 53 ? '#15803d' : props.db <= 65 ? '#d97706' : '#dc2626';

      noiseTooltip.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:#1a1a18;margin-bottom:6px;">
          ${props.name}
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6b6b65;">Noise Level</span>
          <span style="font-weight:500;color:${dbColor};">${props.db} dB</span>
        </div>
        <div style="border-top:0.5px solid #e8e6e0;padding-top:6px;margin-top:4px;
          font-size:10px;color:#a0a09a;line-height:1.4;">
          Port of Seattle airport noise monitoring network
        </div>
      `;

      noiseTooltip.style.left = (e.point.x + 14) + 'px';
      noiseTooltip.style.top = (e.point.y - 20) + 'px';
      noiseTooltip.style.opacity = '1';
    });

    map.on('mouseleave', 'noise-layer', () => {
      map.getCanvas().style.cursor = '';
      noiseTooltip.style.opacity = '0';
    });

    // ── AIR QUALITY SENSOR TOOLTIPS ──
    const aqiTooltip = document.createElement('div');
    aqiTooltip.style.cssText = `
      position: absolute;
      background: white;
      border: 0.5px solid #e8e6e0;
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 20;
      min-width: 160px;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
    `;
    document.querySelector('.map-wrap').appendChild(aqiTooltip);

    map.on('mousemove', 'air-quality-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const props = e.features[0].properties;
      const aqiColor = props.aqi <= 50 ? '#15803d' : props.aqi <= 100 ? '#d97706' : '#dc2626';

      aqiTooltip.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:#1a1a18;margin-bottom:6px;">
          ${props.name}
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6b6b65;">AQI</span>
          <span style="font-weight:500;color:${aqiColor};">${props.aqi}</span>
        </div>
        <div style="border-top:0.5px solid #e8e6e0;padding-top:6px;margin-top:4px;
          font-size:10px;color:#a0a09a;line-height:1.4;">
          PurpleAir community sensor network
        </div>
      `;

      aqiTooltip.style.left = (e.point.x + 14) + 'px';
      aqiTooltip.style.top = (e.point.y - 20) + 'px';
      aqiTooltip.style.opacity = '1';
    });

    map.on('mouseleave', 'air-quality-layer', () => {
      map.getCanvas().style.cursor = '';
      aqiTooltip.style.opacity = '0';
    });

    // ── PARK BOUNDARY LAYER ──
    map.addSource('park-boundaries', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: 'park-boundary-fill',
      type: 'fill',
      source: 'park-boundaries',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': '#15803d',
        'fill-opacity': 0.4
      }
    });

    map.addLayer({
      id: 'park-boundary-outline',
      type: 'line',
      source: 'park-boundaries',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#15803d',
        'line-width': 1
      }
    });

    // ── PARK BOUNDARY TOOLTIPS ──
    const parkTooltip = document.createElement('div');
    parkTooltip.style.cssText = `
      position: absolute;
      background: white;
      border: 0.5px solid #e8e6e0;
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 20;
      min-width: 140px;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
    `;
    document.querySelector('.map-wrap').appendChild(parkTooltip);

    map.on('mousemove', 'park-boundary-fill', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const props = e.features[0].properties;
      parkTooltip.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:#1a1a18;margin-bottom:4px;">
          ${props.NAME}
        </div>
        <div style="font-size:10px;color:#6b6b65;">Seattle Park</div>
      `;
      parkTooltip.style.left = (e.point.x + 14) + 'px';
      parkTooltip.style.top = (e.point.y - 20) + 'px';
      parkTooltip.style.opacity = '1';
    });

    map.on('mouseleave', 'park-boundary-fill', () => {
      map.getCanvas().style.cursor = '';
      parkTooltip.style.opacity = '0';
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

export function updateParkBoundaries(map, parkBoundaries) {
  if (map.getSource('park-boundaries') && parkBoundaries) {
    map.getSource('park-boundaries').setData(parkBoundaries);
  }
}

