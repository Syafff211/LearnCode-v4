-- ============================================================================
-- LearnCode — initial schema
-- Target: Supabase PostgreSQL
--
-- Apply this migration before supabase/seed.sql.
-- All privileged writes (progress, quiz grading, certificates, AI quota) are
-- performed by trusted server code using the service role. RLS protects reads
-- and the few user-owned writes that are safe (profile fields, AI conversations).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  preferred_language text not null default 'id' check (preferred_language in ('id', 'en')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) between 0 and 120)
);

comment on table public.profiles is 'Application profile, 1:1 with auth.users.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Safe profile creation on signup. SECURITY DEFINER is required because the
-- auth service inserts into auth.users and has no direct table privileges.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Users can never escalate their own role, even if a future policy/grant
-- accidentally allows a role column update.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'role tidak dapat diubah oleh pengguna';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- courses and lessons
-- ---------------------------------------------------------------------------

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text not null default '',
  description text not null default '',
  level text not null default 'pemula' check (level in ('pemula', 'menengah', 'lanjutan')),
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  objectives text[] not null default '{}',
  passing_score integer not null default 80 check (passing_score between 0 and 100),
  status text not null default 'published' check (status in ('draft', 'published')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index if not exists courses_status_position_idx on public.courses (status, position);

create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  content_md text not null,
  code_example jsonb not null default '{}'::jsonb,
  exercise jsonb not null default '{}'::jsonb,
  position integer not null,
  estimated_minutes integer not null default 20 check (estimated_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position),
  constraint lessons_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint lessons_code_example_object check (jsonb_typeof(code_example) = 'object'),
  constraint lessons_exercise_object check (jsonb_typeof(exercise) = 'object')
);

create index if not exists lessons_course_position_idx on public.lessons (course_id, position);

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lesson progress
-- ---------------------------------------------------------------------------

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_course_idx
  on public.lesson_progress (user_id, course_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- quizzes
-- Answer keys and explanations live here and are never exposed to clients
-- before submission. All access goes through server code using the service role.
-- ---------------------------------------------------------------------------

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null unique references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  passing_score integer not null default 80 check (passing_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger quizzes_set_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  prompt text not null,
  code text,
  code_language text check (code_language in ('html', 'css', 'javascript')),
  options jsonb not null,
  correct_option_id text not null,
  explanation text not null,
  position integer not null,
  unique (quiz_id, position),
  constraint quiz_questions_options_array check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2
  )
);

create index if not exists quiz_questions_quiz_position_idx
  on public.quiz_questions (quiz_id, position);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  answers jsonb not null,
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  correct_count integer not null default 0,
  question_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_course_idx
  on public.quiz_attempts (user_id, course_id, score desc, created_at desc);

-- ---------------------------------------------------------------------------
-- AI tutor conversations and usage
-- ---------------------------------------------------------------------------

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  title text not null default 'Percakapan baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_user_updated_idx
  on public.ai_conversations (user_id, updated_at desc);

create trigger ai_conversations_set_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 24000),
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at);

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default current_date,
  message_count integer not null default 0 check (message_count >= 0),
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, usage_date)
);

create trigger ai_usage_set_updated_at
before update on public.ai_usage
for each row execute function public.set_updated_at();

-- Atomically consume one AI message from the caller's daily quota.
-- Called only by trusted server code. Returns the new message count for today.
create or replace function public.consume_ai_message(p_user_id uuid)
returns table (message_count integer, usage_date date)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
  insert into public.ai_usage (user_id, usage_date, message_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date) do update
    set message_count = public.ai_usage.message_count + 1,
        updated_at = now()
  returning public.ai_usage.message_count, public.ai_usage.usage_date;
end;
$$;

revoke all on function public.consume_ai_message(uuid) from public;
revoke all on function public.consume_ai_message(uuid) from anon;
revoke all on function public.consume_ai_message(uuid) from authenticated;
grant execute on function public.consume_ai_message(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------------

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  certificate_number text not null unique,
  verification_code text not null unique,
  recipient_name text not null,
  course_title_snapshot text not null,
  final_score integer not null check (final_score between 0 and 100),
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, course_id),
  constraint certificates_certificate_number_format check (
    certificate_number ~ '^LC-[0-9]{4}-[A-Z0-9]{8}$'
  ),
  constraint certificates_verification_code_format check (
    verification_code ~ '^[A-Za-z0-9_-]{16,64}$'
  ),
  constraint certificates_recipient_name_length check (char_length(recipient_name) between 1 and 120)
);

create index if not exists certificates_user_idx on public.certificates (user_id, issued_at desc);
create index if not exists certificates_course_idx on public.certificates (course_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage enable row level security;
alter table public.certificates enable row level security;

-- profiles: read/update own row only. Role is additionally protected by trigger.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Course catalogue is public; it contains no personal data.
drop policy if exists "courses_select_published" on public.courses;
create policy "courses_select_published" on public.courses
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "lessons_select_published_course" on public.lessons;
create policy "lessons_select_published_course" on public.lessons
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id and c.status = 'published'
    )
  );

-- Progress: users can read only their own rows. Writes are server-only.
drop policy if exists "lesson_progress_select_own" on public.lesson_progress;
create policy "lesson_progress_select_own" on public.lesson_progress
  for select to authenticated
  using (auth.uid() = user_id);

-- Quiz attempts: read own history. Writes/grading are server-only.
drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select to authenticated
  using (auth.uid() = user_id);

-- AI conversations: fully user-owned.
drop policy if exists "ai_conversations_select_own" on public.ai_conversations;
create policy "ai_conversations_select_own" on public.ai_conversations
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ai_conversations_insert_own" on public.ai_conversations;
create policy "ai_conversations_insert_own" on public.ai_conversations
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_update_own" on public.ai_conversations;
create policy "ai_conversations_update_own" on public.ai_conversations
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_delete_own" on public.ai_conversations;
create policy "ai_conversations_delete_own" on public.ai_conversations
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ai_messages_select_own" on public.ai_messages;
create policy "ai_messages_select_own" on public.ai_messages
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ai_messages_insert_own" on public.ai_messages;
create policy "ai_messages_insert_own" on public.ai_messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- AI usage: read own quota only. Increment happens through a server-only function.
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select to authenticated
  using (auth.uid() = user_id);

-- Certificates: read own. Issuance is server-only and idempotent.
drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select to authenticated
  using (auth.uid() = user_id);

-- Quizzes and questions: no policies at all. Only the service role
-- (server code, bypasses RLS) can read or write them. This keeps answer keys
-- out of reach even if someone calls the REST API directly with a user token.

-- ---------------------------------------------------------------------------
-- Privileges
-- Supabase grants broad privileges on public tables by default. Remove write
-- access that is not needed, then grant the narrow set users actually need.
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url, preferred_language, theme) on table public.profiles to authenticated;

revoke all on table public.courses from anon, authenticated;
grant select on table public.courses to anon, authenticated;

revoke all on table public.lessons from anon, authenticated;
grant select on table public.lessons to anon, authenticated;

revoke all on table public.lesson_progress from anon, authenticated;
grant select on table public.lesson_progress to authenticated;

revoke all on table public.quizzes from anon, authenticated;
revoke all on table public.quiz_questions from anon, authenticated;

revoke all on table public.quiz_attempts from anon, authenticated;
grant select on table public.quiz_attempts to authenticated;

revoke all on table public.ai_conversations from anon, authenticated;
grant select, insert, update, delete on table public.ai_conversations to authenticated;

revoke all on table public.ai_messages from anon, authenticated;
grant select, insert on table public.ai_messages to authenticated;

revoke all on table public.ai_usage from anon, authenticated;
grant select on table public.ai_usage to authenticated;

revoke all on table public.certificates from anon, authenticated;
grant select on table public.certificates to authenticated;

-- Trigger helpers should not be callable by clients.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.protect_profile_role() from public;
revoke all on function public.protect_profile_role() from anon, authenticated;
revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon, authenticated;
