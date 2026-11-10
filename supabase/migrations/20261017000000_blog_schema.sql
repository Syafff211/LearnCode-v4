-- LearnCode editorial blog tables, row-level security, and public-read grants.
-- Only posts with status=published and a reached publication date are public.

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint blog_categories_name_length check (char_length(name) between 2 and 80),
  constraint blog_categories_description_length check (description is null or char_length(description) <= 300)
);

create index if not exists blog_categories_name_idx
  on public.blog_categories (name);

create trigger blog_categories_set_updated_at
before update on public.blog_categories
for each row execute function public.set_updated_at();

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.blog_categories (id) on delete restrict,
  related_course_id uuid references public.courses (id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content_md text not null,
  author_name text not null default 'LearnCode',
  cover_image text,
  cover_image_alt text,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  reading_minutes integer not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint blog_posts_title_length check (char_length(title) between 5 and 160),
  constraint blog_posts_excerpt_length check (char_length(excerpt) between 40 and 320),
  constraint blog_posts_content_length check (char_length(content_md) between 80 and 40000),
  constraint blog_posts_author_name_length check (char_length(author_name) between 1 and 80),
  constraint blog_posts_cover_image_https check (cover_image is null or cover_image ~ '^https://'),
  constraint blog_posts_cover_alt_required check (
    (cover_image is null and cover_image_alt is null)
    or (cover_image is not null and cover_image_alt is not null and char_length(trim(cover_image_alt)) >= 5)
  ),
  constraint blog_posts_seo_title_length check (seo_title is null or char_length(seo_title) <= 90),
  constraint blog_posts_seo_description_length check (seo_description is null or char_length(seo_description) <= 170),
  constraint blog_posts_published_date_required check (status <> 'published' or published_at is not null),
  constraint blog_posts_reading_minutes_range check (reading_minutes between 1 and 120)
);

create index if not exists blog_posts_publication_idx
  on public.blog_posts (published_at desc)
  where status = 'published';
create index if not exists blog_posts_category_publication_idx
  on public.blog_posts (category_id, published_at desc)
  where status = 'published';
create index if not exists blog_posts_updated_at_idx
  on public.blog_posts (updated_at desc);

create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

-- Public visitors can read only published articles whose publication date has arrived.
drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read
  on public.blog_posts
  for select to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

-- Admins may read drafts through their verified Supabase session. Writes are
-- intentionally unavailable through PostgREST: each mutation must pass the
-- existing server-side admin action, validation, rate limit, and audit path.
drop policy if exists blog_posts_admin_all on public.blog_posts;
drop policy if exists blog_posts_admin_select on public.blog_posts;
create policy blog_posts_admin_select
  on public.blog_posts
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists blog_categories_public_read on public.blog_categories;
create policy blog_categories_public_read
  on public.blog_categories
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.blog_posts bp
      where bp.category_id = blog_categories.id
        and bp.status = 'published'
        and bp.published_at is not null
        and bp.published_at <= now()
    )
  );

drop policy if exists blog_categories_admin_all on public.blog_categories;
drop policy if exists blog_categories_admin_select on public.blog_categories;
create policy blog_categories_admin_select
  on public.blog_categories
  for select to authenticated
  using ((select public.is_admin()));

-- Revoke Supabase's broad default grants. Public users can only read published
-- content; verified admins can read drafts. Mutations are service-role-only and
-- remain inside the authorized, validated server-action boundary.
revoke all on table public.blog_categories from anon, authenticated;
revoke all on table public.blog_posts from anon, authenticated;
grant select on table public.blog_categories, public.blog_posts to anon, authenticated;
grant all on table public.blog_categories, public.blog_posts to service_role;
