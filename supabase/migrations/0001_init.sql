-- ============================================================================
--  NextGen Tycoon — Supabase schema (PostgreSQL)
--  Migration 0001_init
--
--  Design notes
--  ------------
--  * The authoritative game simulation lives client-side in a deterministic
--    TypeScript engine. The full GameState is persisted as JSONB in
--    `save_states` (this powers cloud save, multi-device sync & versioning).
--  * The normalized tables (companies, products, games, …) are projections of
--    that state. They exist for leaderboards, analytics and future server-side
--    features. The client may upsert them, but they are NOT required to play.
--  * Row Level Security: every row is scoped to auth.uid(). A player can only
--    read/write their own data. Public leaderboard reads go through a view.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- helper: keep updated_at fresh
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ============================================================================
-- players  (1:1 with auth.users)
-- ============================================================================
create table if not exists players (
  id           uuid primary key references auth.users(id) on delete cascade,
  handle       text unique,
  display_name text,
  avatar_url   text,
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================================
-- companies  (player + AI competitors are stored inside save_states JSON, but
-- the player's headline company is mirrored here for leaderboards)
-- ============================================================================
create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  name        text not null,
  founded_year int not null,
  cash        numeric not null default 0,
  valuation   numeric not null default 0,
  reputation  numeric not null default 0,
  is_ai       boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- products  (consoles, handhelds, VR/AR, gaming phones, PCs, cloud services)
-- ============================================================================
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  company_id    uuid references companies(id) on delete cascade,
  name          text not null,
  category      text not null,                 -- console_home | handheld | vr_ar | phone | pc | cloud
  release_year  int,
  price         numeric not null default 0,
  performance   numeric not null default 0,
  reliability   numeric not null default 0,
  thermals      numeric not null default 0,
  battery       numeric not null default 0,
  satisfaction  numeric not null default 0,
  units_sold    bigint not null default 0,
  components     jsonb not null default '[]'::jsonb,
  design         jsonb not null default '{}'::jsonb,  -- color, form factor…
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- consoles  (specialization view of products; kept as its own table because
-- the spec explicitly lists it — stores console-only attributes)
-- ============================================================================
create table if not exists consoles (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  generation   int not null default 1,
  form_factor  text,                            -- home | handheld | hybrid
  exclusives   int not null default 0,
  install_base bigint not null default 0
);

-- ============================================================================
-- games  (titles developed by the player)
-- ============================================================================
create table if not exists games (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references players(id) on delete cascade,
  company_id   uuid references companies(id) on delete cascade,
  title        text not null,
  genre        text not null,
  platform_id  uuid references products(id) on delete set null,
  budget       numeric not null default 0,
  dev_months   int not null default 0,
  review_score numeric not null default 0,      -- 0..100
  units_sold   bigint not null default 0,
  release_year int,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- technologies  (global tech catalogue + per-player unlock progress)
-- ============================================================================
create table if not exists technologies (
  id          text primary key,                 -- e.g. cpu_8bit
  name        text not null,
  category    text not null,
  era_start   int not null,
  era_end     int not null,
  cost        numeric not null default 0,
  requires    jsonb not null default '[]'::jsonb
);

create table if not exists player_technologies (
  player_id   uuid not null references players(id) on delete cascade,
  tech_id     text not null references technologies(id) on delete cascade,
  unlocked_at int,                              -- in-game year
  primary key (player_id, tech_id)
);

-- ============================================================================
-- events_history
-- ============================================================================
create table if not exists events_history (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  event_key   text not null,
  title       text not null,
  severity    text not null default 'info',     -- info | good | warn | bad
  year        int not null,
  month       int not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- competitors_ai  (snapshot of AI rivals for the player's run)
-- ============================================================================
create table if not exists competitors_ai (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  name        text not null,
  personality text not null,                    -- aggressive | innovator | budget | premium
  cash        numeric not null default 0,
  reputation  numeric not null default 0,
  market_share numeric not null default 0,
  alive       boolean not null default true,
  state       jsonb not null default '{}'::jsonb
);

-- ============================================================================
-- employees
-- ============================================================================
create table if not exists employees (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  name          text not null,
  tier          text not null default 'junior', -- junior|confirmed|senior|expert|legend
  programming   int not null default 0,
  design        int not null default 0,
  management    int not null default 0,
  creativity    int not null default 0,
  speed         int not null default 0,
  salary        numeric not null default 0,
  xp            int not null default 0,
  hired_year    int
);

-- ============================================================================
-- market_state  (world economy snapshot per player run)
-- ============================================================================
create table if not exists market_state (
  player_id     uuid primary key references players(id) on delete cascade,
  year          int not null,
  month         int not null,
  world_size    numeric not null default 0,
  sentiment     numeric not null default 0,     -- -1..1
  segments      jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- stock_market
-- ============================================================================
create table if not exists stock_market (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  ticker      text not null,
  kind        text not null default 'equity',   -- equity | tech | crypto
  price       numeric not null default 0,
  history     jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- save_states  (the source of truth for cloud save + versioning)
-- ============================================================================
create table if not exists save_states (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  slot        int not null default 0,
  version     int not null default 1,
  label       text,
  game_year   int,
  state       jsonb not null,                   -- full serialized GameState
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (player_id, slot, version)
);

-- ----------------------------------------------------------------------------
-- triggers
-- ----------------------------------------------------------------------------
create trigger trg_players_updated   before update on players      for each row execute function set_updated_at();
create trigger trg_companies_updated before update on companies    for each row execute function set_updated_at();
create trigger trg_save_updated      before update on save_states  for each row execute function set_updated_at();
create trigger trg_market_updated    before update on market_state for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_products_player   on products(player_id);
create index if not exists idx_games_player       on games(player_id);
create index if not exists idx_events_player      on events_history(player_id, year, month);
create index if not exists idx_competitors_player on competitors_ai(player_id);
create index if not exists idx_employees_player   on employees(player_id);
create index if not exists idx_stock_player       on stock_market(player_id, ticker);
create index if not exists idx_saves_player       on save_states(player_id, slot, version desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table players             enable row level security;
alter table companies           enable row level security;
alter table products            enable row level security;
alter table consoles            enable row level security;
alter table games               enable row level security;
alter table player_technologies enable row level security;
alter table events_history      enable row level security;
alter table competitors_ai      enable row level security;
alter table employees           enable row level security;
alter table market_state        enable row level security;
alter table stock_market        enable row level security;
alter table save_states         enable row level security;
-- technologies is a public read-only catalogue
alter table technologies        enable row level security;

-- Generic owner policy generator (player_id = auth.uid()).
do $$
declare t text;
begin
  foreach t in array array[
    'companies','products','games','player_technologies','events_history',
    'competitors_ai','employees','market_state','stock_market','save_states'
  ] loop
    execute format($f$
      create policy "%1$s_owner_all" on %1$s
        for all using (player_id = auth.uid())
        with check (player_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- players: a user manages only their own row
create policy "players_self" on players
  for all using (id = auth.uid()) with check (id = auth.uid());

-- consoles: ownership inherited through products
create policy "consoles_owner_all" on consoles
  for all using (
    exists (select 1 from products p where p.id = consoles.product_id and p.player_id = auth.uid())
  )
  with check (
    exists (select 1 from products p where p.id = consoles.product_id and p.player_id = auth.uid())
  );

-- technologies: everyone authenticated can read the catalogue
create policy "technologies_read" on technologies
  for select using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- public leaderboard (read-only, anonymized)
-- ----------------------------------------------------------------------------
create or replace view leaderboard as
  select c.name, c.valuation, c.reputation, c.founded_year
  from companies c
  where c.is_ai = false
  order by c.valuation desc
  limit 100;
