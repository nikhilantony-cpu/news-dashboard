create table if not exists public.college_updates (
  id bigint not null,
  type text not null check (type in ('news', 'events')),
  date timestamptz not null,
  title text not null,
  content_html text not null default '',
  source_url text not null,
  image_url text,
  image_alt text,
  updated_at timestamptz not null default now(),
  primary key (type, id)
);

create index if not exists college_updates_date_idx
  on public.college_updates (date desc);

alter table public.college_updates enable row level security;

grant select on public.college_updates to anon, authenticated;
revoke insert, update, delete on public.college_updates from anon, authenticated;

drop policy if exists "Public can read college updates" on public.college_updates;
create policy "Public can read college updates"
  on public.college_updates
  for select
  to anon, authenticated
  using (true);