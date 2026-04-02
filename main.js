import { initMap } from "./map/mapInit.js";
import { loadChoropleth } from "./map/choropleth.js";
// import { computeLivabilityScore } from './data/scoreEngine.js';
// import { supabase } from './supabase/client.js';
import { fetchAirQuality } from './data/fetchAirQuality.js';

const sensors = await fetchAirQuality();
console.log('Sensors:', sensors.length);
console.log('First sensor:', sensors[0]);

const map = initMap();
loadChoropleth(map);

