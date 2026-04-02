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

    // Convert park count to 0-100 score
    let greenScore;
    if (count === 0)       greenScore = 0;
    else if (count <= 2)   greenScore = 25;
    else if (count <= 5)   greenScore = 50;
    else if (count <= 10)  greenScore = 75;
    else                   greenScore = 100;

    results[name] = { count, greenScore };
  });

  return results;
}