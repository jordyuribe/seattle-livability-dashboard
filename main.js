import { initMap } from "./map/mapInit.js";
import { loadChoropleth, updateChoropleth } from "./map/choropleth.js";
import { fetchAirQuality, aggregateSensorsByNeighborhood } from './data/fetchAirQuality.js';
import { pm25ToAQI, computeLivabilityScore } from './data/scoreEngine.js';


const map = initMap();
loadChoropleth(map);

// Load neighborhood GeoJSON once — reused every refresh cycle
const geoResponse = await fetch('./assets/seattle_neighborhoods.geojson');
const neighborhoodGeoJSON = await geoResponse.json();

// Main data pipeline — fetch, process, score
async function refreshData() {

  // Step 1 — fetch raw sensor data from PurpleAir via Edge Function
  const sensors = await fetchAirQuality();

  // Step 2 — aggregate sensors into one PM2.5 value per neighborhood
  const pm25ByNeighborhood = aggregateSensorsByNeighborhood(sensors, neighborhoodGeoJSON);

  // Step 3 — convert PM2.5 to AQI and compute livability score per neighborhood
  const scores = {};

  neighborhoodGeoJSON.features.forEach(feature => {
    const name = feature.properties.S_HOOD;
    const pm25 = pm25ByNeighborhood[name];

    // Skip neighborhoods with no sensor data
    if (pm25 === null || pm25 === undefined) {
      scores[name] = null;
      return;
    }

    // Convert raw PM2.5 to AQI using EPA formula
    const aqi = pm25ToAQI(pm25);

    // Compute livability score using mock noise and green space for now
    // we will replace these with real data later
    const score = computeLivabilityScore({
      aqi,
      noiseDb: 60,   // placeholder
      greenPct: 30,  // placeholder
      tempF: 52      // Seattle average
    });

    scores[name] = { aqi, score };
  });

  updateChoropleth(map, scores);
}

// Run immediately then every 5 minutes
refreshData();
setInterval(refreshData, 5 * 60 * 1000);