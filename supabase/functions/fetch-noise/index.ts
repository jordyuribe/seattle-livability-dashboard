import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOISE_TOKEN = '5a245bea277aa4071c86d3667831a564';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CACHE_DURATION_MINUTES = 60;

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const { data: cache } = await supabase
      .from('sensor_cache')
      .select('data, updated_at')
      .eq('id', 'noise')
      .single();

    if (cache) {
      const cacheAge = (Date.now() - new Date(cache.updated_at).getTime()) / 1000 / 60;
      if (cacheAge < CACHE_DURATION_MINUTES) {
        console.log(`Serving noise from cache (${Math.round(cacheAge)} min old)`);
        return new Response(
          JSON.stringify({ sensors: cache.data, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Noise cache expired — fetching from Port of Seattle');

    const response = await fetch(
      `https://app2.symphonycdm.com/MobileVueProxy/getNoiseData?token=${NOISE_TOKEN}`
    );

    if (!response.ok) {
      // Serve stale cache if available
      if (cache) {
        console.log('Noise API failed — serving stale cache');
        return new Response(
          JSON.stringify({ sensors: cache.data, cached: true, stale: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Noise API error: ${response.status}`);
    }

    const raw = await response.json();

    const sensors = raw.Systems[0].Sites
      .filter((s: any) => s.Db > 0)
      .map((s: any) => ({
        id: s.Id,
        name: s.Name,
        latitude: s.Location[0],
        longitude: s.Location[1],
        db: s.Db
      }));

    // Save to cache
    await supabase
      .from('sensor_cache')
      .upsert({ id: 'noise', data: sensors, updated_at: new Date().toISOString() });

    console.log(`Fetched ${sensors.length} noise sensors — cached`);

    return new Response(
      JSON.stringify({ sensors, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

});