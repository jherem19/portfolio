create table if not exists public.side_projects (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  url text not null unique,
  thumbnail text not null,
  thumbnail_path text,
  tools text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (url ~ '^https?://'),
  check (thumbnail <> '')
);

create index if not exists side_projects_created_at_idx
  on public.side_projects(created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'side_projects_set_updated_at'
  ) then
    create trigger side_projects_set_updated_at before update on public.side_projects
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.side_projects enable row level security;

create policy "Side projects are public"
on public.side_projects for select to anon, authenticated
using (true);

create policy "Admins create side projects"
on public.side_projects for insert to authenticated
with check (public.is_portfolio_admin());

create policy "Admins update side projects"
on public.side_projects for update to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Admins delete side projects"
on public.side_projects for delete to authenticated
using (public.is_portfolio_admin());

grant select on table public.side_projects to anon;
grant select, insert, update, delete on table public.side_projects to authenticated;
