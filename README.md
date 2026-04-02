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
| [Seattle Open Data — Socrata](https://data.seattle.gov/resource/v5tj-kqhc.json) | The geojson of Seattle and green spaces |
| [Port of Seattle — PublicVue](https://secure.symphonycdm.com/publicvue/) | Real-time airport noise monitoring from SEA-TAC sensor network | PublicVue Portal — public access |

## Data Pipeline

Raw sensor data from PurpleAir is not pre-aggregated by neighborhood. Each API call returns individual sensor readings at specific lat/lng coordinates scattered across Seattle. To get one representative value per neighborhood we use **Turf.js point-in-polygon** — a spatial query that finds which sensors fall inside each neighborhood boundary polygon, then averages their readings.

The same pattern applies to park data from Socrata — individual park locations are counted per neighborhood using the same point-in-polygon approach.

### Why Socrata for parks?

Seattle's open data portal publishes park boundary files in **State Plane Washington North** coordinate system (EPSG:2926), measured in feet rather than degrees. This is incompatible with the WGS84 lat/lng system that MapLibre and Turf.js expect.

The Socrata API endpoint for park addresses returns coordinates in standard WGS84 lat/lng format, making it directly compatible with our spatial pipeline without any coordinate transformation required.

### API Architecture

All third-party API calls that require secret keys are routed through **Supabase Edge Functions** — server-side functions that run on Supabase's infrastructure. This keeps API keys off the client and avoids CORS restrictions. The PurpleAir key never touches the browser.

The Seattle Open Data Socrata API requires no authentication and does not have CORS restrictions, so it is called directly from the browser.

## Running Locally

1. Clone the repo
```bash
   git clone https://github.com/jordyuribe/seattle-livability-dashboard.git
   cd seattle-livability-dashboard
```

2. Create a `.env` file in the root with your API keys
```
   PURPLEAIR_API_KEY=your_key_here
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_PROJECT_ID=your_project_id
```

3. Deploy the PurpleAir Edge Function to Supabase
```bash
   supabase link --project-ref your_project_id
   supabase secrets set PURPLEAIR_API_KEY=your_key_here
   supabase functions deploy fetch-air-quality
```

4. Open `index.html` with Live Server in VS Code

## Livability Score Methodology

Pillar 1 — Environmental Burden (40%)
Measures the degree to which a neighborhood is exposed to harmful environmental conditions. Inspired by the EPA's Environmental Justice Index (EJI), which scores US census tracts on cumulative environmental burden including air quality and noise exposure. Air quality is scored using EPA AQI breakpoints rather than a simple linear scale — crossing from 100 to 101 represents a meaningful health threshold, not just one point on a continuous scale. Noise is scored against WHO Environmental Noise Guidelines (2018), which identify 53 dB as the threshold above which outdoor noise begins affecting health, and 65 dB as associated with increased cardiovascular risk.

Pillar 2 — Green Access (35%)
Measures access to green space, which research consistently links to mental health, physical activity, and urban heat reduction. Scored using park coverage percentage within each neighborhood boundary. Future versions will incorporate distance decay — a park within walking distance weighted more heavily than one requiring transit — inspired by Walk Score's proximity methodology.

- Green space is currently scored based on the number of parks within each neighborhood boundary rather than total park area, due to coordinate system limitations in the available boundary data. Future versions will incorporate true park coverage percentage using reprojected polygon data.

Pillar 3 — Comfort (25%)
Measures general environmental comfort including temperature. Scored against an ideal comfort range of 55-70°F, with penalties increasing as temperatures deviate from that range in either direction.

Citations:
- U.S. Environmental Protection Agency. (2022). Environmental Justice Index (EJI). Retrieved from eji.cdc.gov
- World Health Organization. (2018). Environmental Noise Guidelines for the European Region. WHO Regional Office for Europe.
- U.S. Environmental Protection Agency. Air Quality Index (AQI) Basics. Retrieved from airnow.gov
Walk Score. Walk Score Methodology. Retrieved from walkscore.com/methodology.shtml

## Future Improvements

- 
- 
- 

---

*Built by Jordy Uribe-Rivas 
