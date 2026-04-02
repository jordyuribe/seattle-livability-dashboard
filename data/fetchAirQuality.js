const SUPABASE_URL = 'https://dtesptsvtqvysdbkyazh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZXNwdHN2dHF2eXNkYmt5YXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTAzNjYsImV4cCI6MjA5MDY2NjM2Nn0.sJ39t3e8v76FUhtvcVQYBR0yps6r4MWrESfbmtZ2wpw';

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