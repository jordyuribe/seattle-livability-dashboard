import { initMap } from "./map/mapInit.js";
import { loadChoropleth } from "./map/choropleth.js";
import { fetchAirQuality, aggregateSensorsByNeighborhood } from './data/fetchAirQuality.js';
import { pm25ToAQI } from './data/scoreEngine.js';


const map = initMap();
loadChoropleth(map);

// Temporary test
const sensors = await fetchAirQuality();

const geoResponse = await fetch('./assets/seattle_neighborhoods.geojson');
const neighborhoodGeoJSON = await geoResponse.json();

const pm25ByNeighborhood = aggregateSensorsByNeighborhood(sensors, neighborhoodGeoJSON);

console.log('PM2.5 by neighborhood:', pm25ByNeighborhood);