-- CRAVE database schema
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create extension if not exists "pgcrypto";

-- ───────────────────────── Profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('seeker', 'employer')),
  full_name text not null default '',
  avatar_url text,
  headline text,
  bio text,
  city text,
  birth_year int,
  categories text[] not null default '{}',
  video_url text,
  prompts jsonb not null default '[]',
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  skills text[] not null default '{}',
  activities text[] not null default '{}',
  availability text[] not null default '{}',
  looking_for text,
  job_title text,
  what_i_look_for text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seekers must be 16 or older.
create or replace function public.enforce_min_age() returns trigger
language plpgsql as $$
begin
  if new.role = 'seeker' and new.birth_year is not null
     and new.birth_year > extract(year from now())::int - 16 then
    raise exception 'CRAVE is for job seekers 16 and older.';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_min_age before insert or update on public.profiles
for each row execute function public.enforce_min_age();

-- ───────────────────────── Companies ─────────────────────────
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null default '',
  kind text not null default 'business' check (kind in ('business', 'contractor')),
  description text,
  logo_url text,
  cover_url text,
  video_url text,
  website text,
  address text,
  latitude double precision,
  longitude double precision,
  service_radius_km int,
  values text[] not null default '{}',
  perks text[] not null default '{}',
  credentials text[] not null default '{}',
  verification text not null default 'unverified'
    check (verification in ('unverified', 'pending', 'verified', 'revoked')),
  created_at timestamptz not null default now()
);

-- Only CRAVE staff (service role) can change verification status.
create or replace function public.protect_verification() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    -- A new verification request may move a company to 'pending' (see on_verification_request).
    if tg_op = 'UPDATE' and new.verification = 'pending'
       and current_setting('crave.allow_pending', true) = 'on' then
      return new;
    end if;
    if tg_op = 'INSERT' then
      new.verification := 'unverified';
    else
      new.verification := old.verification;
    end if;
  end if;
  return new;
end $$;

create trigger companies_protect_verification before insert or update on public.companies
for each row execute function public.protect_verification();

-- HR / hiring managers who represent a company.
create table public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'hr' check (role in ('owner', 'hr')),
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);

-- Subscriptions (written by the RevenueCat webhook). Every new company gets a 30-day free trial.
create table public.subscriptions (
  company_id uuid primary key references public.companies (id) on delete cascade,
  plan text check (plan in ('solo', 'small', 'pro')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'none')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  revenuecat_app_user_id text,
  updated_at timestamptz not null default now()
);

create or replace function public.on_company_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.company_members (company_id, profile_id, role) values (new.id, new.owner_id, 'owner')
    on conflict do nothing;
  insert into public.subscriptions (company_id, status, trial_ends_at, revenuecat_app_user_id)
    values (new.id, 'trialing', now() + interval '30 days', new.owner_id::text)
    on conflict do nothing;
  return new;
end $$;

create trigger companies_after_insert after insert on public.companies
for each row execute function public.on_company_created();

create or replace function public.company_has_access(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.company_id = p_company
      and (s.status = 'active'
           or (s.status = 'trialing' and s.trial_ends_at > now())
           or (s.current_period_end is not null and s.current_period_end > now()))
  );
$$;

create or replace function public.owns_company(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.companies c where c.id = p_company and c.owner_id = auth.uid())
      or exists (select 1 from public.company_members m where m.company_id = p_company and m.profile_id = auth.uid());
$$;

-- ───────────────────────── Jobs ─────────────────────────
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  pay_min numeric,
  pay_max numeric,
  pay_period text not null default 'hour' check (pay_period in ('hour', 'year', 'job')),
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time', 'part_time', 'gig', 'internship')),
  latitude double precision,
  longitude double precision,
  video_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index jobs_active_idx on public.jobs (is_active, category);
create index jobs_geo_idx on public.jobs (latitude, longitude);

-- ───────────────────────── Swipes, matches, messages ─────────────────────────
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  side text not null check (side in ('seeker', 'employer')),
  job_id uuid not null references public.jobs (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  unique (actor_id, job_id, seeker_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (job_id, seeker_id)
);
-- Note: the app embeds the seeker via the auto-named FK matches_seeker_id_fkey.

create or replace function public.is_match_member(p_match uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match and (m.seeker_id = auth.uid() or public.owns_company(m.company_id))
  );
$$;

-- When both sides like each other, create a match.
create or replace function public.on_swipe() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid;
begin
  if not new.liked then return new; end if;
  select company_id into v_company from public.jobs where id = new.job_id;
  if exists (
    select 1 from public.swipes s
    where s.job_id = new.job_id and s.seeker_id = new.seeker_id and s.liked
      and s.side <> new.side
  ) then
    insert into public.matches (job_id, seeker_id, company_id)
      values (new.job_id, new.seeker_id, v_company)
      on conflict (job_id, seeker_id) do nothing;
  end if;
  return new;
end $$;

create trigger swipes_after_upsert after insert or update on public.swipes
for each row execute function public.on_swipe();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_match_idx on public.messages (match_id, created_at);

-- Flag messages that look like common job scams (gift cards, wire transfers, SSN requests...).
create or replace function public.flag_scam_message() returns trigger
language plpgsql as $$
begin
  new.flagged := new.body ~* '(gift ?card|wire (me|the) money|western union|zelle|cash ?app|social security (number|#)|\mssn\M|bank (account|login|password)|pay (a|the) (fee|deposit)|bitcoin|crypto)';
  return new;
end $$;

create trigger messages_flag before insert on public.messages
for each row execute function public.flag_scam_message();

-- ───────────────────────── Safety ─────────────────────────
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'company', 'job', 'message')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  document_paths text[] not null default '{}',
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_notes text,
  created_at timestamptz not null default now()
);

create or replace function public.on_verification_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('crave.allow_pending', 'on', true);
  update public.companies set verification = 'pending'
    where id = new.company_id and verification in ('unverified', 'revoked');
  perform set_config('crave.allow_pending', 'off', true);
  return new;
end $$;
-- Staff approve requests in the Supabase dashboard (service role) by setting companies.verification = 'verified'.
create trigger verification_requests_after_insert after insert on public.verification_requests
for each row execute function public.on_verification_request();

-- ───────────────────────── Feeds ─────────────────────────
create or replace function public.job_feed(
  p_lat double precision default null,
  p_lng double precision default null,
  p_categories text[] default null,
  p_types text[] default null,
  p_verified_only boolean default false,
  p_radius_km double precision default null,
  p_exclude_swiped boolean default true,
  p_limit int default 50
) returns setof jsonb
language sql stable security invoker set search_path = public as $$
  with me as (select p.categories from public.profiles p where p.id = auth.uid()),
  base as (
    select j, c,
      case when p_lat is null or j.latitude is null then null
        else 6371 * 2 * asin(sqrt(
          power(sin(radians(j.latitude - p_lat) / 2), 2) +
          cos(radians(p_lat)) * cos(radians(j.latitude)) * power(sin(radians(j.longitude - p_lng) / 2), 2)))
      end as distance_km
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.is_active
      and public.company_has_access(c.id)
      and (p_categories is null or j.category = any (p_categories))
      and (p_types is null or j.employment_type = any (p_types))
      and (not p_verified_only or c.verification = 'verified')
      and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = c.owner_id)
      and (not p_exclude_swiped or not exists (
        select 1 from public.swipes s where s.actor_id = auth.uid() and s.job_id = j.id))
  )
  select to_jsonb(b.j) || jsonb_build_object('company', to_jsonb(b.c), 'distance_km', b.distance_km)
  from base b
  where p_radius_km is null or b.distance_km is null or b.distance_km <= p_radius_km
  order by
    (case when (b.j).category = any (coalesce((select categories from me), '{}')) then 0 else 1 end),
    (case when (b.c).verification = 'verified' then 0 else 1 end),
    b.distance_km nulls last,
    (b.j).created_at desc
  limit p_limit;
$$;

create or replace function public.seeker_feed(p_job_id uuid, p_limit int default 50)
returns setof public.profiles
language sql stable security invoker set search_path = public as $$
  select p.* from public.profiles p
  join public.jobs j on j.id = p_job_id
  where public.owns_company(j.company_id)
    and p.role = 'seeker' and p.onboarded
    and not exists (select 1 from public.swipes s where s.actor_id = auth.uid() and s.job_id = p_job_id and s.seeker_id = p.id)
    and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id)
    and not exists (select 1 from public.blocks b where b.blocker_id = p.id and b.blocked_id = auth.uid())
  order by
    (exists (select 1 from public.swipes s where s.side = 'seeker' and s.job_id = p_job_id and s.seeker_id = p.id and s.liked)) desc,
    (j.category = any (p.categories)) desc,
    p.updated_at desc
  limit p_limit;
$$;

-- ───────────────────────── Row level security ─────────────────────────
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.jobs enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.verification_requests enable row level security;

-- Profiles: signed-in users can read profiles (employers need to see seekers); you edit only yours.
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());

create policy "companies read" on public.companies for select to authenticated using (true);
create policy "companies insert own" on public.companies for insert to authenticated with check (owner_id = auth.uid());
create policy "companies update own" on public.companies for update to authenticated using (owner_id = auth.uid());
create policy "companies delete own" on public.companies for delete to authenticated using (owner_id = auth.uid());

create policy "members read" on public.company_members for select to authenticated using (true);
create policy "members manage" on public.company_members for all to authenticated
  using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));

create policy "subscription read own" on public.subscriptions for select to authenticated using (public.owns_company(company_id));

create policy "jobs read" on public.jobs for select to authenticated using (true);
create policy "jobs write own" on public.jobs for insert to authenticated
  with check (public.owns_company(company_id) and public.company_has_access(company_id));
create policy "jobs update own" on public.jobs for update to authenticated using (public.owns_company(company_id));
create policy "jobs delete own" on public.jobs for delete to authenticated using (public.owns_company(company_id));

create policy "swipes read own" on public.swipes for select to authenticated using (actor_id = auth.uid());
create policy "swipes seeker" on public.swipes for insert to authenticated
  with check (actor_id = auth.uid() and (
    (side = 'seeker' and seeker_id = auth.uid())
    or (side = 'employer' and exists (select 1 from public.jobs j where j.id = job_id and public.owns_company(j.company_id)))
  ));
create policy "swipes update own" on public.swipes for update to authenticated using (actor_id = auth.uid())
  with check (actor_id = auth.uid());

create policy "matches read own" on public.matches for select to authenticated
  using (seeker_id = auth.uid() or public.owns_company(company_id));
create policy "matches delete own" on public.matches for delete to authenticated
  using (seeker_id = auth.uid() or public.owns_company(company_id));

create policy "messages read" on public.messages for select to authenticated using (public.is_match_member(match_id));
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_match_member(match_id));

create policy "blocks own" on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());

create policy "verification own" on public.verification_requests for select to authenticated using (public.owns_company(company_id));
create policy "verification insert" on public.verification_requests for insert to authenticated with check (public.owns_company(company_id));

-- Realtime for chat
alter publication supabase_realtime add table public.messages;

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('media', 'media', true),
  ('resumes', 'resumes', false),
  ('verification', 'verification', false)
on conflict (id) do nothing;

-- Users upload only into a folder named after their user id.
create policy "upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'media', 'resumes', 'verification')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own folder" on storage.objects for update to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own folder" on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
create policy "read own private files" on storage.objects for select to authenticated
  using (bucket_id in ('resumes', 'verification') and (storage.foldername(name))[1] = auth.uid()::text);
