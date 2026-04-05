const SUPABASE_URL = 'https://dtesptsvtqvysdbkyazh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZXNwdHN2dHF2eXNkYmt5YXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTAzNjYsImV4cCI6MjA5MDY2NjM2Nn0.sJ39t3e8v76FUhtvcVQYBR0yps6r4MWrESfbmtZ2wpw';

export async function fetchAirQuality() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-air-quality`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.warn('Air quality fetch failed:', response.status);
      return null;
    }

    const { sensors } = await response.json();
    return sensors;

  } catch (e) {
    console.warn('Air quality fetch error:', e.message);
    return null;
  }
}

export function aggregateSensorsByNeighborhood(sensors, neighborhoodGeoJSON) {
  const results = {};

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
        coordinates: [s.longitude, s.latitude]
      }
    }))
  };

  neighborhoodGeoJSON.features.forEach(neighborhood => {
    const name = neighborhood.properties.S_HOOD;

    const inside = turf.pointsWithinPolygon(sensorPoints, neighborhood);

    const validReadings = inside.features.filter(f => f.properties.pm25 <= 200);

    if (validReadings.length === 0) {
      results[name] = null;
      return;
    }

    const avgPM25 = validReadings.reduce((sum, f) => {
      return sum + f.properties.pm25;
    }, 0) / validReadings.length;

    results[name] = avgPM25;
  });

  return results;
}