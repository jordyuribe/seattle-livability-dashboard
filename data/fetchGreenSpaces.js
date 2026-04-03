// Fetches Seattle park locations from Seattle Open Data Socrata API
// Returns a GeoJSON FeatureCollection of park points
export async function fetchGreenSpace() {
  const response = await fetch(
    'https://data.seattle.gov/resource/v5tj-kqhc.json?$limit=1000'
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch green space data: ${response.status}`);
  }

  const parks = await response.json();

  // Convert to GeoJSON FeatureCollection
  // Filter out any parks missing coordinates
  const features = parks
    .filter(p => p.x_coord && p.y_coord)
    .map(p => ({
      type: 'Feature',
      properties: {
        name: p.name,
        address: p.address
      },
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(p.x_coord), // longitude
          parseFloat(p.y_coord)  // latitude
        ]
      }
    }));

  return {
    type: 'FeatureCollection',
    features
  };
}

// Counts parks per neighborhood using Turf.js point-in-polygon
// Returns object keyed by neighborhood name with park count and green score
export function aggregateParksByNeighborhood(parksGeoJSON, neighborhoodGeoJSON) {
  const results = {};

  neighborhoodGeoJSON.features.forEach(neighborhood => {
    const name = neighborhood.properties.S_HOOD;

    // Find all parks within this neighborhood boundary
    const inside = turf.pointsWithinPolygon(parksGeoJSON, neighborhood);
    const count = inside.features.length;

    let greenScore;
    if (count === 0)      greenScore = 20;  // no parks — not zero, just low
    else if (count === 1) greenScore = 45;  // at least one park
    else if (count <= 3)  greenScore = 60;  // a few parks
    else if (count <= 6)  greenScore = 75;  // good coverage
    else if (count <= 10) greenScore = 88;  // great coverage
    else                  greenScore = 100; // exceptional

    results[name] = { count, greenScore };
  });

  return results;
}

// Fetches park boundary polygons from Seattle ArcGIS REST API
// Returns GeoJSON FeatureCollection with real park shapes in WGS84
export async function fetchParkBoundaries() {
  const baseUrl = 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Park_Boundaries/FeatureServer/2/query';
  const params = 'where=1%3D1&outFields=NAME&outSR=4326&f=geojson';
  
  let allFeatures = [];
  let offset = 0;
  const limit = 1000;

  // Paginate through all parks
  while (true) {
    const response = await fetch(
      `${baseUrl}?${params}&resultRecordCount=${limit}&resultOffset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Park boundary fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) break;

    allFeatures = allFeatures.concat(data.features);
    offset += limit;

    // Stop if we got fewer than the limit — means we're done
    if (data.features.length < limit) break;
  }

  return {
    type: 'FeatureCollection',
    features: allFeatures
  };
}