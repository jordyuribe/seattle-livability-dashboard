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

Pillar 1 — Environmental Burden (40%)
Measures the degree to which a neighborhood is exposed to harmful environmental conditions. Inspired by the EPA's Environmental Justice Index (EJI), which scores US census tracts on cumulative environmental burden including air quality and noise exposure. Air quality is scored using EPA AQI breakpoints rather than a simple linear scale — crossing from 100 to 101 represents a meaningful health threshold, not just one point on a continuous scale. Noise is scored against WHO Environmental Noise Guidelines (2018), which identify 53 dB as the threshold above which outdoor noise begins affecting health, and 65 dB as associated with increased cardiovascular risk.

Pillar 2 — Green Access (35%)
Measures access to green space, which research consistently links to mental health, physical activity, and urban heat reduction. Scored using park coverage percentage within each neighborhood boundary. Future versions will incorporate distance decay — a park within walking distance weighted more heavily than one requiring transit — inspired by Walk Score's proximity methodology.

Pillar 3 — Comfort (25%)
Measures general environmental comfort including temperature. Scored against an ideal comfort range of 55-70°F, with penalties increasing as temperatures deviate from that range in either direction.

Citations to include:
U.S. Environmental Protection Agency. (2022). Environmental Justice Index (EJI). Retrieved from eji.cdc.gov
World Health Organization. (2018). Environmental Noise Guidelines for the European Region. WHO Regional Office for Europe.
U.S. Environmental Protection Agency. Air Quality Index (AQI) Basics. Retrieved from airnow.gov
Walk Score. Walk Score Methodology. Retrieved from walkscore.com/methodology.shtml

## Future Improvements

- 
- 
- 

---

*Built by Jordy Uribe-Rivas 
