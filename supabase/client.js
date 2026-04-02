import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://dtesptsvtqvysdbkyazh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZXNwdHN2dHF2eXNkYmt5YXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTAzNjYsImV4cCI6MjA5MDY2NjM2Nn0.sJ39t3e8v76FUhtvcVQYBR0yps6r4MWrESfbmtZ2wpw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);