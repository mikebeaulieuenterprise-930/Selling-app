-- Closer · schéma initial (phase 1)
-- À coller dans Supabase → SQL Editor, ou à appliquer avec `supabase db push`.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles · un par utilisateur, créé automatiquement à l'inscription
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  timezone text,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner can update"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- offers · le profil de l'offre (ce que tu vends, à qui, quel problème)
-- ---------------------------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_name text not null,
  product_description text not null,
  price_hint text,
  -- Choix cliquables (clés), plus un texte libre optionnel
  customer_types text[] not null default '{}',
  customer_detail text,
  channels text[] not null default '{}',
  problems text[] not null default '{}',
  problem_detail text,
  -- Positionnement, pitch, arguments et objections générés par l'IA
  ai jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.offers enable row level security;

create policy "offers: owner full access"
  on public.offers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger offers_set_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- segments · les cibles notées par le Radar
-- ---------------------------------------------------------------------------
create table public.segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  offer_id uuid references public.offers (id) on delete cascade,
  name text not null,
  description text,
  need_score integer not null default 0 check (need_score between 0 and 100),
  budget_score integer not null default 0 check (budget_score between 0 and 100),
  reach_score integer not null default 0 check (reach_score between 0 and 100),
  total_score integer not null default 0 check (total_score between 0 and 100),
  reason text,
  where_to_find text[] not null default '{}',
  buying_signals text[] not null default '{}',
  first_message_angle text,
  is_priority boolean not null default false,
  rank integer not null default 0,
  created_at timestamptz not null default now()
);

create index segments_user_rank_idx on public.segments (user_id, rank);

alter table public.segments enable row level security;

create policy "segments: owner full access"
  on public.segments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- leads · les personnes que tu essaies de convaincre
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  segment_id uuid references public.segments (id) on delete set null,
  name text not null,
  company text,
  role text,
  phone text,
  email text,
  channel text not null default 'sms'
    check (channel in ('sms', 'email', 'call', 'linkedin', 'in_person', 'other')),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'replied', 'call_booked', 'won', 'lost')),
  temperature text check (temperature in ('hot', 'warm', 'cold')),
  notes text,
  -- Dernier message que TU as envoyé
  last_contact_at timestamptz,
  -- Dernier message que le lead t'a envoyé
  last_inbound_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_user_status_idx on public.leads (user_id, status);
create index leads_user_follow_up_idx on public.leads (user_id, next_follow_up_at);

alter table public.leads enable row level security;

create policy "leads: owner full access"
  on public.leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reply_analyses · chaque message de lead analysé par l'assistant de réponse
-- ---------------------------------------------------------------------------
create table public.reply_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  channel text not null default 'sms',
  lead_message text not null,
  -- Température, objection, lecture, prochaine étape…
  analysis jsonb not null,
  reply_draft text not null,
  was_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index reply_analyses_user_created_idx on public.reply_analyses (user_id, created_at desc);
create index reply_analyses_lead_idx on public.reply_analyses (lead_id);

alter table public.reply_analyses enable row level security;

create policy "reply_analyses: owner full access"
  on public.reply_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- daily_tasks · la Mission du jour et la série
-- ---------------------------------------------------------------------------
create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_date date not null,
  kind text not null,
  -- Identifiant de la chose visée (ex. id du lead), '' quand il n'y en a pas
  ref_id text not null default '',
  minutes integer not null default 3,
  payload jsonb,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, task_date, kind, ref_id)
);

create index daily_tasks_user_date_idx on public.daily_tasks (user_id, task_date desc);

alter table public.daily_tasks enable row level security;

create policy "daily_tasks: owner full access"
  on public.daily_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
