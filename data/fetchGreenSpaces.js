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