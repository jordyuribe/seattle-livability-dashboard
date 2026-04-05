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