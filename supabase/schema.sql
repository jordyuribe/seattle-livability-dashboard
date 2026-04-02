create table neighborhood_scores (
  neighborhood text primary key,
  aqi numeric,
  noise_db numeric,
  green_pct numeric,
  temp_f numeric,
  burden_score numeric,
  green_score numeric,
  comfort_score numeric,
  livability_score numeric,
  updated_at timestamptz default now()
);

alter table neighborhood_scores enable row level security;

create policy "Public can read scores"
    on neighborhood_scores
    for select
    using (true);

create policy "Service role can write scores"
    on neighborhood_scores
    for insert
    with check (true);

create policy "Service role can update scores"
    on neighborhood_scores
    for update
    using (true);