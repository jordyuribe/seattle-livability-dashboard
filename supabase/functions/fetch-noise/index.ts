import "@supabase/functions-js/edge-runtime.d.ts"

const NOISE_TOKEN = '27d9aeb19a8ca2fcb4a18b33d45c2b0d';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
      const response = await fetch(
        `https://app2.symphonycdm.com/MobileVueProxy/getNoiseData?token=${NOISE_TOKEN}`
      );

      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text.substring(0, 500));

      if (!response.ok) {
        throw new Error(`Noise API error: ${response.status}`);
      }

    const raw = await response.json();

    // Extract sensors from the nested structure
    // Filter out offline sensors (Db of -1)
    const sensors = raw.Systems[0].Sites
      .filter((s: any) => s.Db > 0)
      .map((s: any) => ({
        id: s.Id,
        name: s.Name,
        // API returns [lat, lng] — convert to GeoJSON [lng, lat]
        latitude: s.Location[0],
        longitude: s.Location[1],
        db: s.Db
      }));

    return new Response(
      JSON.stringify({ sensors, serverTime: raw.ServerTime }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

});