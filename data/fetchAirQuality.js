const SUPABASE_URL = 'https://dtesptsvtqvysdbkyazh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZXNwdHN2dHF2eXNkYmt5YXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTAzNjYsImV4cCI6MjA5MDY2NjM2Nn0.sJ39t3e8v76FUhtvcVQYBR0yps6r4MWrESfbmtZ2wpw';

// Calls our Supabase Edge Function which securely fetches
// PurpleAir sensor data for the Seattle bounding box
export async function fetchAirQuality() {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/fetch-air-quality`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch air quality data: ${response.status}`);
  }

  const { sensors } = await response.json();
  return sensors;
}

// Takes raw PurpleAir sensor array and Seattle neighborhood GeoJSON
// Returns an object keyed by neighborhood name with average PM2.5 values
// Uses Turf.js point-in-polygon to find which sensors fall inside each neighborhood
export function aggregateSensorsByNeighborhood(sensors, neighborhoodGeoJSON) {
  const results = {};

  // Convert sensor array into a GeoJSON FeatureCollection of points
  // Turf.js requires GeoJSON format to do spatial operations
  const sensorPoints = {
    type: 'FeatureCollection',
    features: sensors.map(s => ({
      type: 'Feature',
      properties: {
        pm25: s['pm2.5_atm'],
        name: s.name
      },
      geometry: {
        type: 'Point',
        coordinates: [s.longitude, s.latitude] // GeoJSON uses lng/lat order
      }
    }))
  };

  // Loop through every neighborhood polygon in the GeoJSON file
  neighborhoodGeoJSON.features.forEach(neighborhood => {
    const name = neighborhood.properties.S_HOOD;

    // Spatial query — find all sensor points inside this neighborhood boundary
    const inside = turf.pointsWithinPolygon(sensorPoints, neighborhood);

    // If no sensors found in this neighborhood store null
    // null means missing data, not zero — important distinction
    if (inside.features.length === 0) {
      results[name] = null;
      return;
    }

    // Average the PM2.5 readings across all sensors in the neighborhood
    // Averaging smooths out outliers from malfunctioning sensors
    const avgPM25 = inside.features.reduce((sum, f) => {
      return sum + f.properties.pm25;
    }, 0) / inside.features.length;

    results[name] = avgPM25;
  });

  // Returns { "Fremont": 0.1, "Ballard": 6.56, "SODO": 2.7, ... }
  return results;
}