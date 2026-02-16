-- Run this in Supabase SQL editor.

create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  series text not null default 'cup',
  race_id_external int not null,
  name text not null,
  start_time_utc timestamptz not null,
  green_flag_utc timestamptz,
  picks_lock_utc timestamptz not null,
  status text not null default 'scheduled',
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists races_one_current on races (is_current) where is_current = true;

create table if not exists driver_results (
  race_id uuid references races(id) on delete cascade,
  driver_name text not null,
  car_number text,
  qual_pos int,
  running_pos int,
  finish_pos int,
  bracket int,
  updated_at timestamptz not null default now(),
  primary key (race_id, driver_name)
);

create table if not exists picks (
  race_id uuid references races(id) on delete cascade,
  player_name text not null,
  driver_name text not null,
  created_at timestamptz not null default now(),
  primary key (race_id, player_name, driver_name)
);

-- Standings RPC for the season
create or replace function season_standings(season_in int)
returns table (player_name text, total_points int, races_played int)
language sql
as $$
  with race_ids as (
    select id from races where season = season_in
  ),
  picked as (
    select p.player_name, p.race_id, p.driver_name
    from picks p
    join race_ids r on r.id = p.race_id
  ),
  scored as (
    select
      picked.player_name,
      picked.race_id,
      coalesce(dr.finish_pos, dr.running_pos) as pos
    from picked
    join driver_results dr
      on dr.race_id = picked.race_id
     and dr.driver_name = picked.driver_name
    where coalesce(dr.finish_pos, dr.running_pos) is not null
  )
  select
    player_name,
    sum(pos)::int as total_points,
    count(distinct race_id)::int as races_played
  from scored
  group by player_name
  order by total_points asc, player_name asc;
$$;

-- Optional: enable RLS if you want. For now we keep it simple using service-role key server-side.
