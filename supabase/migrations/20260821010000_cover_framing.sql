alter table public.projects
  add column if not exists cover_position_x smallint not null default 50 check (cover_position_x between 0 and 100),
  add column if not exists cover_position_y smallint not null default 50 check (cover_position_y between 0 and 100),
  add column if not exists cover_zoom smallint not null default 100 check (cover_zoom between 100 and 180);

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
      cover_position_x, cover_position_y, cover_zoom,
      cover_video, cover_video_path, category, tags, project_date, client,
      external_url, featured, status, published_at
    ) values (
      (select auth.uid()), trim(p_project ->> 'title'), lower(trim(p_project ->> 'slug')),
      coalesce(p_project ->> 'short_description', ''), coalesce(p_project ->> 'cover_image', ''),
      nullif(p_project ->> 'cover_image_path', ''),
      coalesce((p_project ->> 'cover_position_x')::smallint, 50),
      coalesce((p_project ->> 'cover_position_y')::smallint, 50),
      coalesce((p_project ->> 'cover_zoom')::smallint, 100),
      nullif(p_project ->> 'cover_video', ''), nullif(p_project ->> 'cover_video_path', ''),
      coalesce(p_project ->> 'category', ''),
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
      cover_position_x = coalesce((p_project ->> 'cover_position_x')::smallint, 50),
      cover_position_y = coalesce((p_project ->> 'cover_position_y')::smallint, 50),
      cover_zoom = coalesce((p_project ->> 'cover_zoom')::smallint, 100),
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
