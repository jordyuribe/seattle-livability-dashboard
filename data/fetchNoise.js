const SUPABASE_URL = 'https://dtesptsvtqvysdbkyazh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZXNwdHN2dHF2eXNkYmt5YXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTAzNjYsImV4cCI6MjA5MDY2NjM2Nn0.sJ39t3e8v76FUhtvcVQYBR0yps6r4MWrESfbmtZ2wpw';

export async function fetchNoise() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-noise`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.warn('Noise fetch failed:', response.status);
      return null;
    }

    const { sensors } = await response.json();
    return sensors;

  } catch (e) {
    console.warn('Noise fetch error:', e.message);
    return null;
  }
}

export function aggregateNoiseByNeighborhood(sensors, neighborhoodGeoJSON) {
  const results = {};

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

    const sensorCollection = {
      type: 'FeatureCollection',
      features: sensorPoints
    };
    const inside = turf.pointsWithinPolygon(sensorCollection, neighborhood);

    if (inside.features.length > 0) {
      const avgDb = inside.features.reduce((sum, f) => sum + f.properties.db, 0) / inside.features.length;
      results[name] = { db: Math.round(avgDb * 10) / 10, interpolated: false };
      return;
    }

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

    if (nearestDist <= 15) {
      const weight = 1 - (nearestDist / 15);
      const weightedDb = (nearestDb * weight) + (55 * (1 - weight));
      results[name] = {
        db: Math.round(weightedDb * 10) / 10,
        interpolated: true,
        distanceKm: Math.round(nearestDist * 10) / 10
      };
    } else {
      results[name] = { db: 55, interpolated: true, distanceKm: null };
    }
  });

  return results;
}