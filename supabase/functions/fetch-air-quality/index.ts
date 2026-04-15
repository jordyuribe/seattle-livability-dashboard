import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PURPLEAIR_API_KEY = Deno.env.get('PURPLEAIR_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const SEATTLE_BOUNDS = {
  nwLng: -122.459,
  nwLat: 47.734,
  seLng: -122.224,
  seLat: 47.481
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const CACHE_DURATION_MINUTES = 60;

Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const { data: cache } = await supabase
      .from('sensor_cache')
      .select('data, updated_at')
      .eq('id', 'purpleair')
      .single();

    if (cache) {
      const cacheAge = (Date.now() - new Date(cache.updated_at).getTime()) / 1000 / 60;
      if (cacheAge < CACHE_DURATION_MINUTES) {
        console.log(`Serving from cache (${Math.round(cacheAge)} min old)`);
        return new Response(
          JSON.stringify({ sensors: cache.data, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Cache expired or missing — fetching from PurpleAir');

    // Fetch fresh data from PurpleAir
    const url = new URL('https://api.purpleair.com/v1/sensors');
    url.searchParams.set('fields', 'name,latitude,longitude,pm2.5_atm');
    url.searchParams.set('nwlng', SEATTLE_BOUNDS.nwLng.toString());
    url.searchParams.set('nwlat', SEATTLE_BOUNDS.nwLat.toString());
    url.searchParams.set('selng', SEATTLE_BOUNDS.seLng.toString());
    url.searchParams.set('selat', SEATTLE_BOUNDS.seLat.toString());

    const response = await fetch(url.toString(), {
      headers: { 'X-API-Key': PURPLEAIR_API_KEY }
    });

    if (!response.ok) {
      // If PurpleAir fails, serve stale cache if available
      if (cache) {
        console.log('PurpleAir failed — serving stale cache');
        return new Response(
          JSON.stringify({ sensors: cache.data, cached: true, stale: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // Save to cache
    await supabase
      .from('sensor_cache')
      .upsert({ id: 'purpleair', data: validSensors, updated_at: new Date().toISOString() });

    console.log(`Fetched ${validSensors.length} sensors from PurpleAir — cached`);

    return new Response(
      JSON.stringify({ sensors: validSensors, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});