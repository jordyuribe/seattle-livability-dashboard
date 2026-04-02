const SUPABASE_URL = 'https://dtesptsvtqvysdbkyazh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZXNwdHN2dHF2eXNkYmt5YXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTAzNjYsImV4cCI6MjA5MDY2NjM2Nn0.sJ39t3e8v76FUhtvcVQYBR0yps6r4MWrESfbmtZ2wpw';

// Fetches real-time noise data from SEA-TAC airport noise monitoring network
// via Supabase Edge Function to avoid CORS and hide the token
export async function fetchNoise() {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/fetch-noise`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch noise data: ${response.status}`);
  }

  const { sensors } = await response.json();
  return sensors;
}

// Finds the nearest noise sensor to each neighborhood centroid
// Uses Turf.js to calculate distance between points
export function aggregateNoiseByNeighborhood(sensors, neighborhoodGeoJSON) {
  const results = {};

  // Convert sensors to GeoJSON points for Turf
  const sensorPoints = sensors.map(s => ({
    type: 'Feature',
    properties: { db: s.db, name: s.name },
    geometry: {
      type: 'Point',
      coordinates: [s.longitude, s.latitude]
    }
  }));

  neighborhoodGeoJSON.features.forEach(neighborhood => {
    const name = neighborhood.properties.S_HOOD;

    // First try point-in-polygon — sensor directly inside neighborhood
    const sensorCollection = {
      type: 'FeatureCollection',
      features: sensorPoints
    };
    const inside = turf.pointsWithinPolygon(sensorCollection, neighborhood);

    if (inside.features.length > 0) {
      // Use average of sensors inside the neighborhood
      const avgDb = inside.features.reduce((sum, f) => sum + f.properties.db, 0) / inside.features.length;
      results[name] = { db: Math.round(avgDb * 10) / 10, interpolated: false };
      return;
    }

    // No sensor inside — find nearest sensor using Turf distance
    const centroid = turf.centroid(neighborhood);
    let nearestDb = null;
    let nearestDist = Infinity;

    sensorPoints.forEach(sensor => {
      const dist = turf.distance(centroid, sensor, { units: 'kilometers' });
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestDb = sensor.properties.db;
      }
    });

    // Weight by distance — farther sensors have less influence
    // Beyond 15km the airport noise is negligible, use 55 dB default
    if (nearestDist <= 15) {
      // Linear decay — closer sensors count more
      const weight = 1 - (nearestDist / 15);
      const weightedDb = (nearestDb * weight) + (55 * (1 - weight));
      results[name] = { 
        db: Math.round(weightedDb * 10) / 10, 
        interpolated: true,
        distanceKm: Math.round(nearestDist * 10) / 10
      };
    } else {
      // Too far from any sensor — use Seattle background average
      results[name] = { db: 55, interpolated: true, distanceKm: null };
    }
  });

  return results;
}