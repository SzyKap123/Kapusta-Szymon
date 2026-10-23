-- =====================================================================
-- Schemat bazy danych serwisu z typami AI.
-- Jak użyć: Supabase -> SQL Editor -> New query -> wklej CAŁY plik -> Run.
-- Skrypt można bezpiecznie uruchomić ponownie.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Profile użytkowników ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  adult_confirmed_at timestamptz,
  terms_accepted_at timestamptz,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- Profil tworzy się automatycznie przy rejestracji.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, adult_confirmed_at, terms_accepted_at)
  values (
    new.id,
    new.email,
    case when (new.raw_user_meta_data ->> 'adult_confirmed') = 'true' then now() end,
    case when (new.raw_user_meta_data ->> 'terms_accepted') = 'true' then now() end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Ustawienia (np. wstrzymanie publikacji) ----------
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ---------- Dziennik automatycznego generowania ----------
create table if not exists public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  status text not null check (status in ('running', 'success', 'failed', 'no_matches', 'paused')),
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists generation_runs_date_idx on public.generation_runs (run_date, started_at);

-- ---------- Kupony i typy ----------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  kind text not null check (kind in ('coupon_of_day', 'single')),
  is_free boolean not null default false,
  price_cents integer not null check (price_cents >= 0),
  title text not null,
  summary text not null default '',
  total_odds numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  settled_odds numeric(10, 2),
  content_hash text not null,
  published_at timestamptz not null default now(),
  settled_at timestamptz
);
create index if not exists coupons_date_idx on public.coupons (date desc);

create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete restrict,
  position integer not null,
  fixture_id bigint not null,
  league text not null,
  home_team text not null,
  away_team text not null,
  kickoff timestamptz not null,
  market text not null check (market in ('1X2', 'DC', 'OU', 'BTTS')),
  selection text not null,
  odds numeric(8, 2) not null check (odds > 1),
  confidence integer not null check (confidence between 1 and 5),
  reasoning text not null,
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  score_home integer,
  score_away integer,
  settled_at timestamptz
);
create index if not exists picks_coupon_idx on public.picks (coupon_id);
create index if not exists picks_pending_idx on public.picks (status) where status = 'pending';

-- ---------- NIEZMIENNOŚĆ TYPÓW ----------
-- Opublikowanych typów nie da się edytować ani usunąć. Jedyna dozwolona zmiana
-- to jednorazowe rozliczenie (pending -> won/lost/void) i zapis wyniku.
create or replace function public.protect_coupons() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Opublikowanych kuponów nie można usuwać';
  end if;
  if old.status <> 'pending' then
    raise exception 'Rozliczony kupon nie może być zmieniony';
  end if;
  if new.id <> old.id or new.date <> old.date or new.kind <> old.kind or new.is_free <> old.is_free
     or new.price_cents <> old.price_cents or new.title <> old.title or new.summary <> old.summary
     or new.total_odds <> old.total_odds or new.content_hash <> old.content_hash
     or new.published_at <> old.published_at then
    raise exception 'Treści opublikowanego kuponu nie można zmieniać';
  end if;
  if new.status = 'pending' then
    raise exception 'Dozwolone jest tylko rozliczenie kuponu';
  end if;
  return new;
end $$;

drop trigger if exists coupons_immutable on public.coupons;
create trigger coupons_immutable before update or delete on public.coupons
  for each row execute function public.protect_coupons();

create or replace function public.protect_picks() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Opublikowanych typów nie można usuwać';
  end if;
  if old.status <> 'pending' then
    raise exception 'Rozliczony typ nie może być zmieniony';
  end if;
  if new.id <> old.id or new.coupon_id <> old.coupon_id or new.position <> old.position
     or new.fixture_id <> old.fixture_id or new.league <> old.league or new.home_team <> old.home_team
     or new.away_team <> old.away_team or new.kickoff <> old.kickoff or new.market <> old.market
     or new.selection <> old.selection or new.odds <> old.odds or new.confidence <> old.confidence
     or new.reasoning <> old.reasoning then
    raise exception 'Treści opublikowanego typu nie można zmieniać';
  end if;
  if new.status = 'pending' then
    raise exception 'Dozwolone jest tylko rozliczenie typu';
  end if;
  return new;
end $$;

drop trigger if exists picks_immutable on public.picks;
create trigger picks_immutable before update or delete on public.picks
  for each row execute function public.protect_picks();

create or replace function public.block_truncate() returns trigger language plpgsql as $$
begin
  raise exception 'Czyszczenie tabeli z typami jest zablokowane';
end $$;

drop trigger if exists coupons_no_truncate on public.coupons;
create trigger coupons_no_truncate before truncate on public.coupons
  for each statement execute function public.block_truncate();
drop trigger if exists picks_no_truncate on public.picks;
create trigger picks_no_truncate before truncate on public.picks
  for each statement execute function public.block_truncate();

-- Publikacja wielu kuponów naraz (wszystko albo nic).
create or replace function public.publish_coupons(payload jsonb) returns setof uuid
language plpgsql as $$
declare
  c jsonb;
  p jsonb;
  new_id uuid;
  pos integer;
begin
  for c in select * from jsonb_array_elements(payload) loop
    insert into public.coupons (date, kind, is_free, price_cents, title, summary, total_odds, content_hash, published_at)
    values (
      (c ->> 'date')::date, c ->> 'kind', (c ->> 'is_free')::boolean, (c ->> 'price_cents')::integer,
      c ->> 'title', coalesce(c ->> 'summary', ''), (c ->> 'total_odds')::numeric, c ->> 'content_hash',
      (c ->> 'published_at')::timestamptz
    ) returning id into new_id;
    pos := 0;
    for p in select * from jsonb_array_elements(c -> 'picks') loop
      insert into public.picks (coupon_id, position, fixture_id, league, home_team, away_team, kickoff,
                                market, selection, odds, confidence, reasoning)
      values (
        new_id, pos, (p ->> 'fixture_id')::bigint, p ->> 'league', p ->> 'home_team', p ->> 'away_team',
        (p ->> 'kickoff')::timestamptz, p ->> 'market', p ->> 'selection', (p ->> 'odds')::numeric,
        (p ->> 'confidence')::integer, p ->> 'reasoning'
      );
      pos := pos + 1;
    end loop;
    return next new_id;
  end loop;
end $$;

-- ---------- Subskrypcje, zakupy, zgody ----------
create table if not exists public.subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

create table if not exists public.coupon_access (
  user_id uuid not null references public.profiles (id) on delete cascade,
  coupon_id uuid not null references public.coupons (id),
  ledger_external_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, coupon_id)
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  text text not null,
  reference text not null,
  created_at timestamptz not null default now()
);

-- ---------- Ewidencja sprzedaży ----------
-- user_id bez klucza obcego: zapis w ewidencji zostaje nawet po usunięciu konta.
create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  user_id uuid,
  kind text not null check (kind in ('coupon', 'subscription', 'refund')),
  amount_cents integer not null,
  description text not null,
  occurred_at timestamptz not null
);
create index if not exists ledger_occurred_idx on public.ledger (occurred_at);

-- ---------- Bezpieczeństwo ----------
-- Dostęp do danych ma wyłącznie serwer (klucz service_role). Przeglądarka nie czyta tabel bezpośrednio.
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.generation_runs enable row level security;
alter table public.coupons enable row level security;
alter table public.picks enable row level security;
alter table public.subscriptions enable row level security;
alter table public.coupon_access enable row level security;
alter table public.consents enable row level security;
alter table public.ledger enable row level security;

revoke execute on function public.publish_coupons(jsonb) from public, anon, authenticated;
