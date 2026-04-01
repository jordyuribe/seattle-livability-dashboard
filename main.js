import { initMap } from "./map/mapInit.js";
import { loadChoropleth } from "./map/choropleth.js";

const map = initMap();
loadChoropleth(map);