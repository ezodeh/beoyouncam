-- Create events table
create table if not exists public.events (
  token text primary key,
  title text not null,
  description text,
  cover_url text,
  sign_in_method text not null check (sign_in_method in ('phone','email')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.events enable row level security;

-- Allow public read access to events (public-facing)
create policy "Anyone can view events"
  on public.events
  for select
  using (true);
