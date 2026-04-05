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
      return null; // return null instead of throwing
    }

    const { sensors } = await response.json();
    return sensors;

  } catch (e) {
    console.warn('Noise fetch error:', e.message);
    return null; // return null on any error
  }
}