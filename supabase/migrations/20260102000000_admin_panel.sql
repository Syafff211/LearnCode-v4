-- ---------------------------------------------------------------------------
-- LearnCode admin panel
--
-- Adds the data model the admin area needs on top of the learning schema:
--   * role vocabulary `user` | `admin` (was `student` | `admin`)
--   * course/lesson lifecycle (`draft` | `published` | `archived`)
--   * lesson + question ordering, weights and required flags
--   * certificate revocation that preserves history
--   * account suspension
--   * platform settings and AI tutor settings (singleton rows)
--   * an append-only admin audit log
--
-- Every admin write goes through trusted server code using the service role.
-- Clients only ever get read access, and only for rows they own or when the
-- caller is an admin (checked server-side *and* by RLS via public.is_admin()).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Roles: `user` replaces `student`
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'user' where role = 'student';
alter table public.profiles alter column role set default 'user';
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin'));

-- ---------------------------------------------------------------------------
-- Account suspension
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists suspended_by uuid;

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);
create index if not exists profiles_role_idx
  on public.profiles (role);

-- Shared authorization helper used by RLS policies and the admin server code.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.suspended_at is null
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Courses: archived lifecycle state, language, completion requirement
-- ---------------------------------------------------------------------------

alter table public.courses drop constraint if exists courses_status_check;
alter table public.courses add constraint courses_status_check
  check (status in ('draft', 'published', 'archived'));

alter table public.courses
  add column if not exists language text not null default 'id'
    check (language in ('id', 'en')),
  add column if not exists require_all_lessons boolean not null default true;

create index if not exists courses_updated_at_idx
  on public.courses (updated_at desc);

-- ---------------------------------------------------------------------------
-- Lessons: lifecycle, required flag, learning objectives
-- ---------------------------------------------------------------------------

alter table public.lessons
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists required boolean not null default true,
  add column if not exists objectives text[] not null default '{}';

create index if not exists lessons_status_idx on public.lessons (status);

-- ---------------------------------------------------------------------------
-- Quizzes: required flag, question weights, immutable attempt snapshots
-- ---------------------------------------------------------------------------

alter table public.quizzes
  add column if not exists required boolean not null default true;

alter table public.quiz_questions
  add column if not exists weight integer not null default 1
    check (weight between 1 and 10);

-- Old attempts keep their recorded score and passed flag. The snapshot records
-- which rule set produced them so score-rule changes are never retroactive.
alter table public.quiz_attempts
  add column if not exists passing_score integer,
  add column if not exists scoring_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(scoring_snapshot) = 'object');

create index if not exists quiz_attempts_quiz_created_idx
  on public.quiz_attempts (quiz_id, created_at desc);
create index if not exists lesson_progress_course_user_idx
  on public.lesson_progress (course_id, user_id);

-- ---------------------------------------------------------------------------
-- Certificates: revocation keeps the row and its verification code
-- ---------------------------------------------------------------------------

alter table public.certificates
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid,
  add column if not exists revocation_reason text;

create index if not exists certificates_issued_at_idx
  on public.certificates (issued_at desc);
create index if not exists certificates_revoked_idx
  on public.certificates (revoked_at)
  where revoked_at is not null;

-- ---------------------------------------------------------------------------
-- Platform settings (singleton)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  platform_name text not null default 'LearnCode'
    check (char_length(platform_name) between 2 and 60),
  short_description text not null default ''
    check (char_length(short_description) <= 280),
  logo_url text,
  favicon_url text,
  default_language text not null default 'id' check (default_language in ('id', 'en')),
  certificate_signature text not null default 'Tim LearnCode'
    check (char_length(certificate_signature) between 2 and 80),
  default_passing_score integer not null default 80
    check (default_passing_score between 0 and 100),
  contact_email text
    check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_url text
    check (contact_url is null or contact_url ~* '^https://'),
  maintenance_mode boolean not null default false,
  maintenance_message text not null default ''
    check (char_length(maintenance_message) <= 280),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- AI tutor settings (singleton)
--
-- Secrets are never stored here. The Groq API key stays in the server
-- environment; this table only holds safe, validated behaviour settings.
-- ---------------------------------------------------------------------------

create table if not exists public.ai_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default true,
  daily_message_limit integer not null default 30
    check (daily_message_limit between 1 and 200),
  max_input_chars integer not null default 4000
    check (max_input_chars between 200 and 20000),
  max_output_tokens integer not null default 1200
    check (max_output_tokens between 100 and 4000),
  model text not null default 'openai/gpt-oss-120b'
    check (char_length(model) between 3 and 120),
  features jsonb not null default
    '["explain","debug","hint","review","general"]'::jsonb
    check (jsonb_typeof(features) = 'array'),
  learning_instructions text not null default ''
    check (char_length(learning_instructions) <= 4000),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create trigger ai_settings_set_updated_at
before update on public.ai_settings
for each row execute function public.set_updated_at();

insert into public.ai_settings (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Admin audit log (append-only)
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text not null default '',
  action text not null check (action ~ '^[a-z][a-z0-9_.]{2,60}$'),
  target_type text not null check (target_type ~ '^[a-z][a-z0-9_]{1,40}$'),
  target_id text,
  reason text check (reason is null or char_length(reason) <= 500),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_idx
  on public.admin_audit_logs (actor_user_id, created_at desc);
create index if not exists admin_audit_logs_target_idx
  on public.admin_audit_logs (target_type, target_id);

-- History must stay trustworthy: even the service role cannot rewrite it.
create or replace function public.admin_audit_logs_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'admin_audit_logs bersifat append-only';
end;
$$;

drop trigger if exists admin_audit_logs_no_update on public.admin_audit_logs;
create trigger admin_audit_logs_no_update
before update or delete on public.admin_audit_logs
for each row execute function public.admin_audit_logs_immutable();

revoke all on function public.admin_audit_logs_immutable() from public;
revoke all on function public.admin_audit_logs_immutable() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Deletion safety nets
--
-- history is never destroyed by deleting a course/lesson that people used.
-- Admins archive instead; a hard delete is only allowed while nothing
-- references the row.
-- ---------------------------------------------------------------------------

create or replace function public.protect_course_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.certificates c where c.course_id = old.id) then
    raise exception 'course_has_certificates';
  end if;
  if exists (
    select 1 from public.quiz_attempts qa where qa.course_id = old.id
  ) then
    raise exception 'course_has_attempts';
  end if;
  if exists (
    select 1 from public.lesson_progress lp where lp.course_id = old.id
  ) then
    raise exception 'course_has_progress';
  end if;
  return old;
end;
$$;

drop trigger if exists courses_protect_history on public.courses;
create trigger courses_protect_history
before delete on public.courses
for each row execute function public.protect_course_history();

create or replace function public.protect_lesson_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.lesson_progress lp where lp.lesson_id = old.id
  ) then
    raise exception 'lesson_has_progress';
  end if;
  return old;
end;
$$;

drop trigger if exists lessons_protect_history on public.lessons;
create trigger lessons_protect_history
before delete on public.lessons
for each row execute function public.protect_lesson_history();

revoke all on function public.protect_course_history() from public;
revoke all on function public.protect_course_history() from anon, authenticated;
revoke all on function public.protect_lesson_history() from public;
revoke all on function public.protect_lesson_history() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.platform_settings enable row level security;
alter table public.ai_settings enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Profiles: keep own-row access, let admins read every profile. No client
-- write policies exist; admin edits happen through the service role.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using (public.is_admin());

-- Courses: published rows stay public; admins can read drafts and archives.
drop policy if exists "courses_select_published" on public.courses;
create policy "courses_select_published" on public.courses
  for select to anon, authenticated
  using (status = 'published' or public.is_admin());

-- Lessons follow the parent course, including for admins.
drop policy if exists "lessons_select_published_course" on public.lessons;
create policy "lessons_select_published_course" on public.lessons
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
        and (c.status = 'published' or public.is_admin())
    )
  );

-- Certificates: owners keep access; admins can audit every certificate.
drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "certificates_select_admin" on public.certificates;
create policy "certificates_select_admin" on public.certificates
  for select to authenticated
  using (public.is_admin());

-- Platform settings: any visitor may read the public presentation values; only
-- the service role writes them.
drop policy if exists "platform_settings_select_public" on public.platform_settings;
create policy "platform_settings_select_public" on public.platform_settings
  for select to anon, authenticated
  using (true);

-- AI settings: admins only. The AI route reads them with the service role.
drop policy if exists "ai_settings_select_admin" on public.ai_settings;
create policy "ai_settings_select_admin" on public.ai_settings
  for select to authenticated
  using (public.is_admin());

-- Audit log: admins read, nobody writes through the client.
drop policy if exists "admin_audit_logs_select_admin" on public.admin_audit_logs;
create policy "admin_audit_logs_select_admin" on public.admin_audit_logs
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on table public.platform_settings from anon, authenticated;
grant select on table public.platform_settings to anon, authenticated;
revoke insert, update, delete on table public.platform_settings from anon, authenticated;

revoke all on table public.ai_settings from anon, authenticated;
grant select on table public.ai_settings to authenticated;
revoke insert, update, delete on table public.ai_settings from anon, authenticated;

revoke all on table public.admin_audit_logs from anon, authenticated;
grant select on table public.admin_audit_logs to authenticated;
revoke insert, update, delete on table public.admin_audit_logs from anon, authenticated;

grant select, insert, update, delete on table public.platform_settings to service_role;
grant select, insert, update, delete on table public.ai_settings to service_role;
grant select, insert on table public.admin_audit_logs to service_role;

-- Existing tables changed above also need service-role writes (admin actions).
grant select, insert, update, delete on table public.courses to service_role;
grant select, insert, update, delete on table public.lessons to service_role;
grant select, insert, update, delete on table public.quizzes to service_role;
grant select, insert, update, delete on table public.quiz_questions to service_role;
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.certificates to service_role;
