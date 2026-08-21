create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null default '',
  cover_image text not null default '',
  cover_image_path text,
  cover_video text,
  cover_video_path text,
  category text not null default '',
  tags text[] not null default '{}',
  project_date date not null default current_date,
  client text,
  external_url text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('rich_text', 'image', 'gallery', 'video', 'section')),
  position integer not null default 0 check (position >= 0),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, position)
);

create index if not exists projects_public_listing_idx
  on public.projects(status, featured desc, project_date desc);
create index if not exists project_blocks_order_idx
  on public.project_blocks(project_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists project_blocks_set_updated_at on public.project_blocks;
create trigger project_blocks_set_updated_at before update on public.project_blocks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active = true
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_blocks enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_portfolio_admin());

create policy "Admins manage profiles"
on public.profiles for all to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Published projects are public"
on public.projects for select to anon, authenticated
using (status = 'published' or public.is_portfolio_admin());

create policy "Admins create projects"
on public.projects for insert to authenticated
with check (public.is_portfolio_admin());

create policy "Admins update projects"
on public.projects for update to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Admins delete projects"
on public.projects for delete to authenticated
using (public.is_portfolio_admin());

create policy "Published project blocks are public"
on public.project_blocks for select to anon, authenticated
using (
  public.is_portfolio_admin()
  or exists (
    select 1 from public.projects
    where projects.id = project_blocks.project_id and projects.status = 'published'
  )
);

create policy "Admins create project blocks"
on public.project_blocks for insert to authenticated
with check (public.is_portfolio_admin());

create policy "Admins update project blocks"
on public.project_blocks for update to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Admins delete project blocks"
on public.project_blocks for delete to authenticated
using (public.is_portfolio_admin());

create or replace function public.save_project_with_blocks(
  p_project_id uuid,
  p_project jsonb,
  p_blocks jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_status text := coalesce(p_project ->> 'status', 'draft');
begin
  if not public.is_portfolio_admin() then
    raise exception 'Not authorized';
  end if;

  if v_status not in ('draft', 'published') then
    raise exception 'Invalid project status';
  end if;

  if p_project_id is null then
    insert into public.projects (
      created_by, title, slug, short_description, cover_image, cover_image_path,
      cover_video, cover_video_path, category, tags, project_date, client,
      external_url, featured, status, published_at
    ) values (
      (select auth.uid()), trim(p_project ->> 'title'), lower(trim(p_project ->> 'slug')),
      coalesce(p_project ->> 'short_description', ''), coalesce(p_project ->> 'cover_image', ''),
      nullif(p_project ->> 'cover_image_path', ''), nullif(p_project ->> 'cover_video', ''),
      nullif(p_project ->> 'cover_video_path', ''), coalesce(p_project ->> 'category', ''),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_project -> 'tags', '[]'::jsonb))), '{}'),
      coalesce((p_project ->> 'project_date')::date, current_date), nullif(p_project ->> 'client', ''),
      nullif(p_project ->> 'external_url', ''), coalesce((p_project ->> 'featured')::boolean, false),
      v_status, case when v_status = 'published' then now() else null end
    ) returning id into v_project_id;
  else
    update public.projects set
      title = trim(p_project ->> 'title'),
      slug = lower(trim(p_project ->> 'slug')),
      short_description = coalesce(p_project ->> 'short_description', ''),
      cover_image = coalesce(p_project ->> 'cover_image', ''),
      cover_image_path = nullif(p_project ->> 'cover_image_path', ''),
      cover_video = nullif(p_project ->> 'cover_video', ''),
      cover_video_path = nullif(p_project ->> 'cover_video_path', ''),
      category = coalesce(p_project ->> 'category', ''),
      tags = coalesce(array(select jsonb_array_elements_text(coalesce(p_project -> 'tags', '[]'::jsonb))), '{}'),
      project_date = coalesce((p_project ->> 'project_date')::date, current_date),
      client = nullif(p_project ->> 'client', ''),
      external_url = nullif(p_project ->> 'external_url', ''),
      featured = coalesce((p_project ->> 'featured')::boolean, false),
      status = v_status,
      published_at = case
        when v_status = 'published' then coalesce(published_at, now())
        else null
      end
    where id = p_project_id
    returning id into v_project_id;

    if v_project_id is null then raise exception 'Project not found'; end if;
  end if;

  delete from public.project_blocks where project_id = v_project_id;
  insert into public.project_blocks (project_id, type, position, data)
  select
    v_project_id,
    item ->> 'type',
    (ordinality - 1)::integer,
    coalesce(item -> 'data', '{}'::jsonb)
  from jsonb_array_elements(coalesce(p_blocks, '[]'::jsonb)) with ordinality as blocks(item, ordinality);

  return v_project_id;
end;
$$;

revoke all on function public.save_project_with_blocks(uuid, jsonb, jsonb) from public;
grant execute on function public.save_project_with_blocks(uuid, jsonb, jsonb) to authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.projects, public.project_blocks to anon;
grant select on table public.profiles, public.projects, public.project_blocks to authenticated;
grant insert, update, delete on table public.profiles, public.projects, public.project_blocks to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins upload portfolio media"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

create policy "Admins update portfolio media"
on storage.objects for update to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin())
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

create policy "Admins delete portfolio media"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

insert into public.projects
  (title, slug, short_description, cover_image, category, tags, project_date, featured, status, published_at)
values
  ('Stratadex', 'stratadex', 'A clear product experience for navigating a complex digital-asset ecosystem.', '/work/stratadex.png', 'Digital product', array['Product Design', 'Web3'], '2026-01-01', true, 'published', now()),
  ('Security, made clear', 'security-made-clear', 'A motion-led system that turns security flows into calm, legible moments.', '/work/security-flow.png', 'Product motion', array['Motion Design', 'Product'], '2026-01-01', true, 'published', now()),
  ('Minah', 'minah', 'An editorial campaign language built around purpose, warmth, and impact.', '/work/minah.png', 'Brand experience', array['Brand Experience', 'Campaign'], '2025-01-01', true, 'published', now()),
  ('Sound, reimagined', 'sound-reimagined', 'A tactile 3D product study where industrial detail meets playful color.', '/work/audio-device.png', '3D product study', array['Real-time 3D', 'Art Direction'], '2025-01-01', true, 'published', now()),
  ('rdon', 'rdon', 'A focused commerce experience for a high-performance cycling product.', '/work/rdon.png', 'Commerce experience', array['Product Design', 'E-commerce'], '2025-01-01', true, 'published', now()),
  ('Digital matter 01', 'digital-matter-01', 'An abstract study of texture, depth, and light in a digital material.', '/work/blue-form.png', 'Visual experiment', array['3D Exploration'], '2024-01-01', true, 'published', now()),
  ('Sustainable systems', 'sustainable-systems', 'A digital experience that makes sustainability feel active and contemporary.', '/work/green-product.png', 'Web experience', array['Digital Product', 'Web'], '2024-01-01', false, 'published', now()),
  ('Digital matter 02', 'digital-matter-02', 'A second material study exploring organic volume and saturated color.', '/work/green-form.png', 'Visual experiment', array['3D Exploration'], '2024-01-01', false, 'published', now()),
  ('Interface studies', 'interface-studies', 'A modular dashboard concept designed to make complex information scannable.', '/work/game-console.png', 'Product interface', array['Product Design', 'Fintech'], '2023-01-01', false, 'published', now()),
  ('Pocket worlds', 'pocket-worlds', 'A nostalgic handheld object reinterpreted through contemporary 3D craft.', '/work/dashboard.png', '3D product study', array['3D Design', 'Product'], '2023-01-01', false, 'published', now()),
  ('Control', 'control', 'A cinematic real-time study of form, material, and controlled light.', '/work/game-controller.png', 'Product visualization', array['Real-time 3D'], '2022-01-01', false, 'published', now())
on conflict (slug) do nothing;

insert into public.project_blocks (project_id, type, position, data)
select id, 'section', 0, jsonb_build_object(
  'title', 'Making the idea feel clear, useful, and distinctive.',
  'markdown', short_description
)
from public.projects
where not exists (
  select 1 from public.project_blocks where project_blocks.project_id = projects.id
);

-- After creating the first user in Authentication > Users, promote only that account:
-- update public.profiles set role = 'admin', active = true
-- where id = (select id from auth.users where email = 'YOUR_EMAIL');
