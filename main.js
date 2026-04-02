import { initMap } from "./map/mapInit.js";
import { loadChoropleth } from "./map/choropleth.js";
// import { computeLivabilityScore } from './data/scoreEngine.js';

const map = initMap();
loadChoropleth(map);
