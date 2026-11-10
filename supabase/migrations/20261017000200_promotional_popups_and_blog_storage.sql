-- Promotional popup management, public media buckets, and required blog covers.
-- Storage contains public presentation assets only; all uploads are admin-only.

-- ---------------------------------------------------------------------------
-- Public media buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('blog-covers', 'blog-covers', true, 5242880, array['image/webp']::text[]),
  ('promotion-assets', 'promotion-assets', true, 5242880, array['image/webp']::text[])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public GET is limited to these two public image buckets. Inserts require a
-- verified active admin and a per-user immutable path; updates/deletes use the
-- server-side service role only after the corresponding authorized mutation.
drop policy if exists learncode_public_media_read on storage.objects;
create policy learncode_public_media_read
  on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('blog-covers', 'promotion-assets'));

drop policy if exists learncode_admin_media_insert on storage.objects;
create policy learncode_admin_media_insert
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('blog-covers', 'promotion-assets')
    and (select public.is_admin())
    and (storage.foldername(name))[1] = auth.uid()::text
    and name ~* '\.webp$'
  );

-- ---------------------------------------------------------------------------
-- Blog covers are required for every publicly published article.
-- ---------------------------------------------------------------------------
alter table public.blog_posts
  add column if not exists cover_image_path text;

alter table public.blog_posts
  drop constraint if exists blog_posts_cover_image_path_format;
alter table public.blog_posts
  add constraint blog_posts_cover_image_path_format
  check (
    cover_image_path is null
    or cover_image_path ~* '^[0-9a-f-]{36}/[a-z0-9]+(-[a-z0-9]+)*-[0-9a-f-]{36}\.webp$'
  );

alter table public.blog_posts
  drop constraint if exists blog_posts_cover_image_https;
alter table public.blog_posts
  add constraint blog_posts_cover_image_https
  check (
    cover_image is null
    or cover_image ~ '^https://'
    or cover_image ~ '^http://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/'
  );

-- The ten starter posts currently have no uploaded artwork. Keep their content,
-- but make them drafts until an admin uploads a relevant, described cover.
update public.blog_posts
set status = 'draft', updated_at = now()
where status = 'published'
  and (cover_image_path is null or cover_image is null or cover_image_alt is null or char_length(trim(cover_image_alt)) < 5);

alter table public.blog_posts
  drop constraint if exists blog_posts_published_cover_required;
alter table public.blog_posts
  add constraint blog_posts_published_cover_required
  check (
    status <> 'published'
    or (
      cover_image_path is not null
      and cover_image is not null
      and cover_image_alt is not null
      and char_length(trim(cover_image_alt)) >= 5
    )
  );

create index if not exists blog_posts_cover_image_path_idx
  on public.blog_posts (cover_image_path)
  where cover_image_path is not null;

-- Recreate public visibility with a defensive cover requirement in addition to
-- the database CHECK. Drafts remain available to the existing admin server path.
drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read
  on public.blog_posts
  for select to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
    and cover_image_path is not null
    and cover_image is not null
    and cover_image_alt is not null
    and char_length(trim(cover_image_alt)) >= 5
  );

-- ---------------------------------------------------------------------------
-- Popup configuration
-- ---------------------------------------------------------------------------
create table if not exists public.promotional_popups (
  id uuid primary key default gen_random_uuid(),
  internal_name text not null unique,
  title text not null,
  description text not null default '',
  image_path text,
  image_url text,
  image_alt text,
  primary_button_text text,
  primary_button_url text,
  secondary_button_text text,
  secondary_button_url text,
  styling_config jsonb not null default '{
    "backgroundColor":"#faf9f5",
    "textColor":"#25251f",
    "buttonColor":"#a8d35b",
    "buttonTextColor":"#1a2012",
    "position":"center",
    "size":"normal",
    "backdropClose":true
  }'::jsonb,
  display_config jsonb not null default '{"pageTargets":["all_public"],"customPaths":[]}'::jsonb,
  popup_type text not null default 'promotion'
    check (popup_type in ('promotion', 'announcement', 'information', 'custom')),
  frequency text not null default 'every_reload'
    check (frequency in ('every_reload', 'once_per_session', 'once_per_day', 'once_per_user', 'every_visit')),
  audience text not null default 'all'
    check (audience in ('all', 'guest', 'authenticated')),
  priority integer not null default 0 check (priority between 0 and 10000),
  is_primary boolean not null default false,
  is_active boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotional_popups_internal_name_length check (char_length(internal_name) between 3 and 100),
  constraint promotional_popups_title_length check (char_length(title) between 3 and 120),
  constraint promotional_popups_description_length check (char_length(description) <= 1200),
  constraint promotional_popups_image_storage_pair check (
    (image_path is null and image_url is null and image_alt is null)
    or (
      image_path is not null
      and image_path ~* '^[0-9a-f-]{36}/[a-z0-9]+(-[a-z0-9]+)*-[0-9a-f-]{36}\.webp$'
      and image_url is not null
      and (
        image_url ~ '^https://'
        or image_url ~ '^http://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/'
      )
      and image_alt is not null
      and char_length(trim(image_alt)) between 5 and 180
    )
  ),
  constraint promotional_popups_primary_button_pair check (
    (primary_button_text is null and primary_button_url is null)
    or (
      primary_button_text is not null
      and char_length(trim(primary_button_text)) between 1 and 60
      and primary_button_url is not null
      and primary_button_url !~* '^\s*(javascript|data|vbscript):'
    )
  ),
  constraint promotional_popups_secondary_button_pair check (
    (secondary_button_text is null and secondary_button_url is null)
    or (
      secondary_button_text is not null
      and char_length(trim(secondary_button_text)) between 1 and 60
      and secondary_button_url is not null
      and secondary_button_url !~* '^\s*(javascript|data|vbscript):'
    )
  ),
  constraint promotional_popups_config_objects check (
    jsonb_typeof(styling_config) = 'object'
    and jsonb_typeof(display_config) = 'object'
  ),
  constraint promotional_popups_date_order check (ends_at is null or ends_at > starts_at)
);

create index if not exists promotional_popups_active_priority_idx
  on public.promotional_popups (is_primary desc, priority desc, starts_at)
  where is_active = true;
create index if not exists promotional_popups_schedule_idx
  on public.promotional_popups (starts_at, ends_at)
  where is_active = true;

create unique index if not exists promotional_popups_single_primary_idx
  on public.promotional_popups (is_primary)
  where is_primary = true;

drop trigger if exists promotional_popups_set_updated_at on public.promotional_popups;
create trigger promotional_popups_set_updated_at
before update on public.promotional_popups
for each row execute function public.set_updated_at();

alter table public.promotional_popups enable row level security;

-- A public row is returned only while active and inside its schedule. The
-- SECURITY DEFINER predicate reads schedule columns without granting those
-- internal columns through PostgREST.
create or replace function public.promotional_popup_is_current(p_popup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.promotional_popups popup
    where popup.id = p_popup_id
      and popup.is_active = true
      and popup.starts_at <= now()
      and (popup.ends_at is null or popup.ends_at > now())
  );
$function$;
revoke all on function public.promotional_popup_is_current(uuid) from public;
grant execute on function public.promotional_popup_is_current(uuid) to anon, authenticated;

drop policy if exists promotional_popups_public_read on public.promotional_popups;
create policy promotional_popups_public_read
  on public.promotional_popups
  for select to anon, authenticated
  using ((select public.promotional_popup_is_current(id)));

revoke all on table public.promotional_popups from anon, authenticated;
grant select (
  id, title, description, image_url, image_alt,
  primary_button_text, primary_button_url,
  secondary_button_text, secondary_button_url,
  styling_config, display_config, frequency, audience, priority, is_primary
) on table public.promotional_popups to anon, authenticated;
grant all on table public.promotional_popups to service_role;

-- Server-authorized toggle for the single primary popup. The function is only
-- executable by the server's service-role client after requireAdminAction().
create or replace function public.set_primary_promotional_popup(p_popup_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Aksi hanya boleh dilakukan oleh server LearnCode';
  end if;

  update public.promotional_popups
  set is_primary = false
  where is_primary = true;

  if p_popup_id is not null then
    update public.promotional_popups
    set is_primary = true
    where id = p_popup_id;
    if not found then
      raise exception 'Popup tidak ditemukan';
    end if;
  end if;
end;
$function$;
revoke all on function public.set_primary_promotional_popup(uuid) from public, anon, authenticated;
grant execute on function public.set_primary_promotional_popup(uuid) to service_role;

-- Once-per-user is persisted against the verified Supabase user, not a
-- user-controlled identifier or browser-only cookie.
create table if not exists public.promotional_popup_user_views (
  popup_id uuid not null references public.promotional_popups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (popup_id, user_id)
);
create index if not exists promotional_popup_user_views_user_idx
  on public.promotional_popup_user_views (user_id, created_at desc);

alter table public.promotional_popup_user_views enable row level security;
revoke all on table public.promotional_popup_user_views from anon, authenticated;
grant select (popup_id, user_id) on table public.promotional_popup_user_views to authenticated;
grant insert (popup_id, user_id) on table public.promotional_popup_user_views to authenticated;

drop policy if exists promotional_popup_user_views_read_own on public.promotional_popup_user_views;
create policy promotional_popup_user_views_read_own
  on public.promotional_popup_user_views
  for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.can_record_promotional_popup_view(p_popup_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) = p_user_id
    and exists (
      select 1 from public.promotional_popups popup
      where popup.id = p_popup_id
        and popup.frequency = 'once_per_user'
        and popup.is_active = true
        and popup.starts_at <= now()
        and (popup.ends_at is null or popup.ends_at > now())
    );
$function$;
revoke all on function public.can_record_promotional_popup_view(uuid, uuid) from public, anon;
grant execute on function public.can_record_promotional_popup_view(uuid, uuid) to authenticated;

drop policy if exists promotional_popup_user_views_insert_own on public.promotional_popup_user_views;
create policy promotional_popup_user_views_insert_own
  on public.promotional_popup_user_views
  for insert to authenticated
  with check (
    (select public.can_record_promotional_popup_view(popup_id, user_id))
  );

-- Preserve the already-approved MasterCode promotion as editable database data.
-- The frontend never embeds this copy or destination in its source code.
insert into public.promotional_popups (
  internal_name, title, description,
  primary_button_text, primary_button_url,
  secondary_button_text, secondary_button_url,
  styling_config, display_config, popup_type, frequency, audience,
  priority, is_primary, is_active, starts_at
)
values (
  'mastercode-promotion',
  'Kenalan dengan MasterCode',
  'MasterCode adalah web app buat ngedit & kelola repository GitHub langsung dari browser, cocok untuk belajar dan mengerjakan project kecil dengan workflow yang rapi.',
  'Kunjungi MasterCode', 'https://mastercode.biz.id',
  'Buka LearnCode', '/',
  '{
    "backgroundColor":"#faf9f5",
    "textColor":"#25251f",
    "buttonColor":"#a8d35b",
    "buttonTextColor":"#1a2012",
    "position":"center",
    "size":"normal",
    "backdropClose":true
  }'::jsonb,
  '{"pageTargets":["all_public","all_user"],"customPaths":[]}'::jsonb,
  'promotion', 'every_reload', 'all', 100, true, true, now()
)
on conflict (internal_name) do nothing;
