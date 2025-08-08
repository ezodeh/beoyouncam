-- Create participants table for event welcome capture gating
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_token text not null,
  user_id uuid null,
  method text not null check (method in ('phone','email','google')),
  country_code text null,
  phone text null,
  email text null,
  name text null,
  consent boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.participants enable row level security;

-- Allow anyone to insert a participant (public capture flow)
create policy "Anyone can insert participant"
  on public.participants
  for insert
  to anon, authenticated
  with check (true);

-- Optional: Disallow select by default (no select policy)
-- If needed later, we can add a policy to allow users to read their own entries.
