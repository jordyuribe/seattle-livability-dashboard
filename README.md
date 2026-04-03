# Seattle Urban Livability Dashboard

A real-time environmental dashboard that tracks air quality, noise levels, and green space across Seattle neighborhoods and combines them into a single livability score displayed on an interactive choropleth map.



## Overview

I built this dashboard to surface environmental data that affects people's daily lives in Seattle but isn't easy to see in one place. Inspired by IoT sensor networks I saw in South Korea, I wanted to create something that shows not just raw data but show which neighborhoods are more exposed to pollution, noise, and lack of green space, and how that shapes livability across the city.

The dashboard pulls from three live APIs, aggregates sensor readings by neighborhood using geospatial analysis, and computes a weighted livability score per neighborhood based on EPA and WHO environmental health thresholds.

## Features

- Real-time air quality monitoring using 367 PurpleAir community sensors across Seattle
- Interactive choropleth map showing livability scores by neighborhood updated every 5 minutes
- Noise monitoring using Port of Seattle's SEA-TAC airport sensor network with distance decay interpolation
- Park boundary visualization from Seattle Open Data showing actual green space coverage
- Weighted three-pillar scoring algorithm grounded in EPA and WHO methodology
- Layer toggles for air quality, noise, and green space overlays with independent legends
- Hover tooltips showing per-neighborhood AQI, noise, green coverage, and livability score
- Active alerts when neighborhoods breach EPA or WHO health thresholds
- Secure API architecture — all secret keys routed through Supabase Edge Functions

## Tech Stack

| Layer | Technology |
|---|---|
| Map Rendering | MapLibre GL JS |
| Backend / Database | Supabase (Postgres + Edge Functions) |
| Geospatial Analysis | Turf.js (point-in-polygon aggregation) |
| Air Quality | PurpleAir API |
| Noise Monitoring | Port of Seattle PublicVue (Symphony CDM) |
| Green Space | Seattle Open Data (Socrata + ArcGIS REST API) |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Basemap | CartoDB Voyager |

## Data Sources

| Source | What it provides | Access |
|---|---|---|
| [PurpleAir API](https://community.purpleair.com/t/about-the-purpleair-api/7145) | Real-time PM2.5 readings from 367 community sensors | REST API — requires API key |
| [Port of Seattle PublicVue](https://secure.symphonycdm.com/publicvue/) | Live dB readings from 22 SEA-TAC airport noise sensors | Public access |
| [Seattle Open Data — Socrata](https://data.seattle.gov/resource/v5tj-kqhc.json) | Park locations with WGS84 coordinates | Socrata API — no key required |
| [Seattle ArcGIS REST API](https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Park_Boundaries/FeatureServer/2) | Park boundary polygons in WGS84 | Public ArcGIS REST — no key required |

## Data Pipeline

Raw sensor data from PurpleAir returns individual sensor readings at lat/lng coordinates scattered across Seattle — not pre-aggregated by neighborhood. To get one representative value per neighborhood, we use **Turf.js point-in-polygon** — a spatial query that finds which sensors fall inside each neighborhood boundary polygon, then averages their readings.

The same pattern applies to park data — individual park locations are counted per neighborhood using point-in-polygon, then converted to a green space score.

For noise, the Port of Seattle sensors are clustered around SEA-TAC airport rather than distributed across Seattle neighborhoods. We use a **distance decay interpolation** — each neighborhood gets a noise value blended between the nearest sensor reading and a background average of 55 dB, weighted by distance. Neighborhoods within 15km of a sensor get meaningfully differentiated noise scores.

### Why ArcGIS REST for park boundaries?

Seattle's open data portal exports park boundary GeoJSON in **State Plane Washington North** (EPSG:2926), measured in feet — incompatible with the WGS84 lat/lng system MapLibre and Turf.js expect. The ArcGIS REST API for the same dataset supports an `outSR=4326` parameter that returns coordinates in standard WGS84, making it directly compatible without coordinate transformation.

### API Security Architecture

All API calls requiring secret keys are routed through **Supabase Edge Functions** — server-side TypeScript functions running on Supabase's Deno runtime. The PurpleAir key and Port of Seattle token never reach the browser. The Supabase anon key is designed to be public-facing and is safe in client-side code when Row Level Security is enabled.

## Running Locally

1. Clone the repo
```bash
git clone https://github.com/jordyuribe/seattle-livability-dashboard.git
cd seattle-livability-dashboard
```

2. Create a `.env` file in the root:
```
PURPLEAIR_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_PROJECT_ID=your_project_id
```

3. Install Supabase CLI and deploy Edge Functions:
```bash
supabase login
supabase link --project-ref your_project_id
supabase secrets set PURPLEAIR_API_KEY=your_key_here
supabase functions deploy fetch-air-quality
supabase functions deploy fetch-noise
```

4. Open `index.html` with Live Server in VS Code

## Livability Score Methodology

The livability score is built on two pillars, each grounded in established environmental health research.

**Pillar 1 — Environmental Burden (55%)**

Combines air quality (60%) and noise (40%) into a single burden score. Inspired by the EPA Environmental Justice Index (EJI), which scores US census tracts on cumulative environmental burden. Air quality uses EPA AQI breakpoints — crossing from AQI 100 to 101 is a meaningful health threshold, not just one point on a linear scale. Noise is scored against WHO Environmental Noise Guidelines (2018), which identify 53 dB as the safe outdoor threshold and 65 dB as associated with cardiovascular risk.

**Pillar 2 — Green Access (45%)**

Scored based on the number of parks within each neighborhood boundary using Seattle Open Data park locations aggregated via Turf.js point-in-polygon. Green space is currently scored by park count rather than total park area due to coordinate system limitations in the available boundary data. Future versions will incorporate true park coverage percentage.

Temperature was removed as a metric because it does not vary meaningfully between Seattle neighborhoods and does not represent an environmental justice concern at the city scale.

**Citations:**
- U.S. Environmental Protection Agency. (2022). *Environmental Justice Index (EJI)*. eji.cdc.gov
- World Health Organization. (2018). *Environmental Noise Guidelines for the European Region*. WHO Regional Office for Europe.
- U.S. Environmental Protection Agency. *Air Quality Index (AQI) Basics*. airnow.gov
- Walk Score. *Walk Score Methodology*. walkscore.com/methodology.shtml

## Future Improvements

- Supabase Realtime score persistence — save scores to DB on every refresh for historical trend analysis
- Expand coverage to King County including SeaTac, Burien, and Tukwila
- True park coverage percentage using reprojected polygon boundary data
- Traffic data layer as an additional noise and air quality proxy
- Mobile responsive layout

---

*Built by Jordy Uribe-Rivas · Seattle University MS Computer Science*  
*Inspired by IoT environmental monitoring networks observed in South Korea*
