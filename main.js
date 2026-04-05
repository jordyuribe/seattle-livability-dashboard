import { initMap } from "./map/mapInit.js";
import { fetchAirQuality, aggregateSensorsByNeighborhood } from './data/fetchAirQuality.js';
import { pm25ToAQI, computeLivabilityScore } from './data/scoreEngine.js';
import { updateSidebar } from './components/sidebar.js';
import { fetchGreenSpace, fetchParkBoundaries, aggregateParksByNeighborhood } from './data/fetchGreenSpaces.js';
import { fetchNoise, aggregateNoiseByNeighborhood } from './data/fetchNoise.js';
import { initLayerToggles } from './map/layers.js';
import { loadChoropleth, updateChoropleth, updateSensorLayers, updateParkBoundaries } from './map/choropleth.js';


const map = initMap();
loadChoropleth(map);


// Wait for map to load before initializing toggles
map.on('load', () => {
  initLayerToggles(map);
});

// Update last updated timestamp after each data refresh
function updateLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (el) {
    const now = new Date();
    el.textContent = `Updated ${now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    })}`;
  }
}


// Load neighborhood GeoJSON once — reused every refresh cycle
const geoResponse = await fetch('./assets/seattle_neighborhoods.geojson');
const neighborhoodGeoJSON = await geoResponse.json();

// Main data pipeline — fetch, process, score
// Runs immediately on load then every 5 minutes
async function refreshData() {

  // Fetch all three sources — handle failures individually
  let sensors = null;
  let parksGeoJSON = null;
  let noiseSensors = null;
  let parkBoundaries = null;

  try {
    [sensors, parksGeoJSON, noiseSensors, parkBoundaries] = await Promise.all([
      fetchAirQuality(),
      fetchGreenSpace(),
      fetchNoise(),
      fetchParkBoundaries()
    ]);
  } catch (err) {
    // If any single source fails try them individually
    console.warn('Parallel fetch failed, trying individually:', err.message);

    try { sensors = await fetchAirQuality(); }
    catch (e) { console.warn('Air quality unavailable:', e.message); }

    try { parksGeoJSON = await fetchGreenSpace(); }
    catch (e) { console.warn('Green space unavailable:', e.message); }

    try { noiseSensors = await fetchNoise(); }
    catch (e) { console.warn('Noise unavailable:', e.message); }

    try { parkBoundaries = await fetchParkBoundaries(); }
    catch (e) { console.warn('Park boundaries unavailable:', e.message); }
  }

  const pm25ByNeighborhood = sensors
    ? aggregateSensorsByNeighborhood(sensors, neighborhoodGeoJSON)
    : {};

  const parksByNeighborhood = parksGeoJSON
    ? aggregateParksByNeighborhood(parksGeoJSON, neighborhoodGeoJSON)
    : {};

  const noiseByNeighborhood = noiseSensors
    ? aggregateNoiseByNeighborhood(noiseSensors, neighborhoodGeoJSON)
    : {};

  const scores = {};

  neighborhoodGeoJSON.features.forEach(feature => {
    const name = feature.properties.S_HOOD;
    const pm25 = pm25ByNeighborhood[name];
    const parkData = parksByNeighborhood[name];
    const noiseData = noiseByNeighborhood[name];

    // If no air quality data use a neutral AQI of 50
    // so the map still renders with noise and green space scores
    const aqi = sensors
      ? (pm25 !== null && pm25 !== undefined ? pm25ToAQI(pm25) : null)
      : 50;

    if (aqi === null) {
      scores[name] = null;
      return;
    }

    const greenPct = parkData ? parkData.greenScore : 30;
    const noiseDb = noiseData ? noiseData.db : 55;

    const score = computeLivabilityScore({ aqi, noiseDb, greenPct });

    scores[name] = { aqi, score, greenPct, noiseDb,
      noiseInterpolated: noiseData ? noiseData.interpolated : true
    };
  });

  updateChoropleth(map, scores);
  updateSidebar(scores);
  updateSensorLayers(map, sensors || [], noiseSensors || []);
  updateParkBoundaries(map, parkBoundaries);
  updateLastUpdated();
}

// Run immediately on page load then refresh every 5 minutes
// 5 * 60 * 1000 = 5 minutes in milliseconds
refreshData();
setInterval(refreshData, 30 * 60 * 1000);