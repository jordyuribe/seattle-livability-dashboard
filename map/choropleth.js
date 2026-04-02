import { initTooltip, showTooltip, hideTooltip } from '../components/tooltip.js';


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
          aqi: data ? data.aqi : null
        }
      };
    })
  };

  // Update the map source — MapLibre re-renders automatically
  map.getSource('neighborhoods').setData(updatedGeoJSON);
}