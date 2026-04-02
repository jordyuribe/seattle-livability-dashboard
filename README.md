# Seattle Urban Livability Dashboard

A real-time dashboard the tracks the environmental factors of the area in Seattle.

![Dashboard Screenshot]
<!-- you'll replace this with a real screenshot later -->

## Overview

I am building a real time data dashboard that measures air quality, noise, and other urban livability factors (green spaces) in the Seattle Metro area that displays it on a map. In addition to these measurements, I will do some data analysis that takes all of these into account that will produce a geospatial map (choropleth) that measures areas in the Seattle Metro area on a scale to determine a score of livability/environmental sustainability based on these factors.

## Features

- Real-time air quality monioring using PurpleAir sensor network.
- Interactive choropleth map showing livability scores by Seattle neighborhood.
- Noise, green space, and temoerpature data layers with toggle controls.
- Weighted scoring algorithm combining environmental facotrs into 0-100 livability score
- Live data updates via Supabase Realtime - map re-renders automatically when new data arrives.
- Hover tooltips showing per-neighborhood breakdown metrics.

## Tech Stack

| Layer | Technology |
|---|---|
| Map Rendering | MapLibre GL JS |
| Backend / Database | Supabase (Postgres + Realtime) |
| Data Sources | PurpleAir API, Seattle Open Data, OpenSky Network |
| Geospatial Utilities | Turf.js |
| Frontend | HTML, CSS, Vanilla JS |

## Data Sources

| Source | What it provides |
|---|---|
| [PurpleAir API](https://community.purpleair.com/t/about-the-purpleair-api/7145) | The air quality in Seattle |
| [Seattle Open Data](https://data.seattle.gov) | The geojson of Seattle and green spaces |
| [OpenSky Network](https://opensky-network.org/data/api) | Noise |

## Running Locally

1. 
2. 
3. 

## Livability Score Methodology

[Explain how the score is computed — what metrics, what weights, why 
those weights. Write this in your own words.]

## Future Improvements

- 
- 
- 

---

*Built by Jordy Uribe-Rivas 
