import "@supabase/functions-js/edge-runtime.d.ts"

const PURPLEAIR_API_KEY = Deno.env.get('PURPLEAIR_API_KEY') ?? '';

const SEATTLE_BOUNDS = {
  nwLng: -122.459,
  nwLat: 47.734,
  seLng: -122.224,
  seLat: 47.481
};

// CORS headers — required for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

Deno.serve(async (req) => {

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL('https://api.purpleair.com/v1/sensors');
    url.searchParams.set('fields', 'name,latitude,longitude,pm2.5_atm,pm2.5_atm_a,pm2.5_atm_b');
    url.searchParams.set('nwlng', SEATTLE_BOUNDS.nwLng.toString());
    url.searchParams.set('nwlat', SEATTLE_BOUNDS.nwLat.toString());
    url.searchParams.set('selng', SEATTLE_BOUNDS.seLng.toString());
    url.searchParams.set('selat', SEATTLE_BOUNDS.seLat.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': PURPLEAIR_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`PurpleAir API error: ${response.status}`);
    }

    const rawData = await response.json();

    const fields = rawData.fields;
    const sensors = rawData.data.map((sensor: number[]) => {
      const obj: Record<string, number | string> = {};
      fields.forEach((field: string, i: number) => {
        obj[field] = sensor[i];
      });
      return obj;
    });

    const validSensors = sensors.filter((s: Record<string, number | string>) =>
      s.latitude &&
      s.longitude &&
      s['pm2.5_atm'] !== null &&
      s['pm2.5_atm'] !== undefined
    );

    return new Response(
      JSON.stringify({ sensors: validSensors }),
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