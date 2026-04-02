import { initMap } from "./map/mapInit.js";
import { loadChoropleth, updateChoropleth } from "./map/choropleth.js";
import { fetchAirQuality, aggregateSensorsByNeighborhood } from './data/fetchAirQuality.js';
import { pm25ToAQI, computeLivabilityScore } from './data/scoreEngine.js';
import { updateSidebar } from './components/sidebar.js';
import { fetchGreenSpace, aggregateParksByNeighborhood } from './data/fetchGreenSpaces.js';
import { fetchNoise, aggregateNoiseByNeighborhood } from './data/fetchNoise.js';


const map = initMap();
loadChoropleth(map);

// Load neighborhood GeoJSON once — reused every refresh cycle
const geoResponse = await fetch('./assets/seattle_neighborhoods.geojson');
const neighborhoodGeoJSON = await geoResponse.json();

// Main data pipeline — fetch, process, score
// Runs immediately on load then every 5 minutes
async function refreshData() {

  // Step 1 — fetch air quality sensors and park locations in parallel
  // Promise.all fires both requests simultaneously instead of one at a time
  // this cuts load time roughly in half since they are independent of each other
  const [sensors, parksGeoJSON, noiseSensors] = await Promise.all([
    fetchAirQuality(),
    fetchGreenSpace(),
    fetchNoise()
  ]);

  // Step 2 — aggregate PurpleAir sensors into one PM2.5 value per neighborhood
  // uses Turf.js point-in-polygon to find which sensors fall inside each boundary
  const pm25ByNeighborhood = aggregateSensorsByNeighborhood(sensors, neighborhoodGeoJSON);

  // Step 3 — count parks per neighborhood and convert to a 0-100 green score
  // more parks = higher score, capped at 100 for 10+ parks
  const parksByNeighborhood = aggregateParksByNeighborhood(parksGeoJSON, neighborhoodGeoJSON);

  const noiseByNeighborhood = aggregateNoiseByNeighborhood(noiseSensors, neighborhoodGeoJSON);


  // Step 4 — convert raw metrics to scores and compute final livability score
  const scores = {};

  neighborhoodGeoJSON.features.forEach(feature => {
    const name = feature.properties.S_HOOD;
    const pm25 = pm25ByNeighborhood[name];
    const parkData = parksByNeighborhood[name];
    const noiseData = noiseByNeighborhood[name];

    // Skip neighborhoods with no air quality sensor data
    if (pm25 === null || pm25 === undefined) {
      scores[name] = null;
      return;
    }

    // Convert raw PM2.5 reading to AQI using EPA breakpoint formula
    const aqi = pm25ToAQI(pm25);

    // Use real park count as green score — falls back to 30 if no park data
    const greenPct = parkData ? parkData.greenScore : 30;

    // use real noise data if available, otherwise default to 55 dB which is typical for Seattle neighborhoods
    const noiseDb = noiseData ? noiseData.db : 55;


    // Compute final weighted livability score across all three pillars
    // noise is still a placeholder until OpenSky data is wired in
    const score = computeLivabilityScore({
      aqi,
      noiseDb,  // placeholder — replace when noise API is connected
      greenPct,     // real data from Seattle Open Data
      tempF: 52     // Seattle annual average temperature
    });

    // Store all values so sidebar and tooltip can display them
    scores[name] = { 
      aqi, 
      score, 
      greenPct, 
      noiseDb,
      noiseInterpolated: noiseData ? noiseData.interpolated : true
    };  
  });

  // Step 5 — push updated scores to the map and sidebar
  updateChoropleth(map, scores);
  updateSidebar(scores);  
  
}

// Run immediately on page load then refresh every 5 minutes
// 5 * 60 * 1000 = 5 minutes in milliseconds
refreshData();
setInterval(refreshData, 5 * 60 * 1000);