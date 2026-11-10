-- LOCAL DATABASE VERIFICATION — run after local_bootstrap.sql, the migration and seed.
-- Usage (against a disposable local database):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
--
-- Verifies RLS policies, column privileges, triggers and constraints that the
-- application relies on. Raises an exception on the first failed assertion.

\set ON_ERROR_STOP on

-- Deterministic test users ---------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'a@example.test', '{"full_name":"Pengguna A"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'b@example.test', '{"full_name":"Pengguna B"}'::jsonb)
on conflict (id) do nothing;

do $$
begin
  if (select count(*) from public.profiles where id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  )) <> 2 then
    raise exception 'FAIL: auth trigger did not create profiles';
  end if;
  if (select full_name from public.profiles where id = '11111111-1111-4111-8111-111111111111') <> 'Pengguna A' then
    raise exception 'FAIL: profile full_name not taken from metadata';
  end if;
end $$;

-- Draft content exists for the policy checks but is not public.
insert into public.blog_posts (category_id, slug, title, excerpt, content_md, status)
select
  id,
  'rls-draft-post',
  'Draft untuk uji RLS',
  'Konten draft ini hanya boleh dibaca oleh admin yang terverifikasi.',
  repeat('Konten draft untuk pengujian kebijakan akses. ', 4),
  'draft'
from public.blog_categories
where slug = 'javascript'
on conflict (slug) do nothing;

-- Anonymous access ------------------------------------------------------------
set role anon;
select set_config('request.jwt.claim.sub', '', false);

do $$
begin
  if (select count(*) from public.courses) <> 3 then
    raise exception 'FAIL: anonymous cannot read published courses';
  end if;
  if (select count(*) from public.lessons) <> 13 then
    raise exception 'FAIL: anonymous cannot read lessons of published courses';
  end if;
  if (select count(*) from public.blog_posts) <> 10 then
    raise exception 'FAIL: anonymous should see only the 10 published blog posts';
  end if;
  if (select count(*) from public.blog_posts where slug = 'rls-draft-post') <> 0 then
    raise exception 'FAIL: anonymous can read a draft blog post';
  end if;
  if (select count(*) from public.blog_posts where related_course_id is null) <> 0 then
    raise exception 'FAIL: starter blog posts are missing their published course links';
  end if;
  if (select count(*) from public.blog_categories) <> 5 then
    raise exception 'FAIL: anonymous should see only categories with published posts';
  end if;
end $$;

do $$
begin
  begin
    insert into public.courses (slug, title) values ('hacked-course', 'Hacked');
    raise exception 'FAIL: anonymous was able to insert a course';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    insert into public.blog_posts (category_id, slug, title, excerpt, content_md)
    select id, 'anonymous-blog-write', 'Tidak boleh', 'Tulisan untuk uji penolakan write anonim.', repeat('Konten uji. ', 10)
    from public.blog_categories where slug = 'javascript';
    raise exception 'FAIL: anonymous was able to insert a blog post';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Authenticated user A --------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'FAIL: user A can see other profiles';
  end if;
  if (select id from public.profiles limit 1) <> '11111111-1111-4111-8111-111111111111' then
    raise exception 'FAIL: user A does not see own profile';
  end if;
  if (select count(*) from public.blog_posts) <> 10 then
    raise exception 'FAIL: user A should see published blog posts only';
  end if;
  if (select count(*) from public.blog_posts where slug = 'rls-draft-post') <> 0 then
    raise exception 'FAIL: non-admin user A can read a draft blog post';
  end if;
  begin
    update public.blog_posts set status = 'draft' where slug = 'html-struktur-semantik';
    raise exception 'FAIL: authenticated user can update blog posts directly';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Updating own display fields is allowed.
update public.profiles set full_name = 'Pengguna A Diperbarui'
where id = '11111111-1111-4111-8111-111111111111';

do $$
begin
  if (select full_name from public.profiles) <> 'Pengguna A Diperbarui' then
    raise exception 'FAIL: user A cannot update own full_name';
  end if;
end $$;

-- Role escalation is blocked by column privilege and by the guard trigger.
do $$
begin
  begin
    update public.profiles set role = 'admin'
    where id = '11111111-1111-4111-8111-111111111111';
    raise exception 'FAIL: user A was able to change own role';
  exception when insufficient_privilege then null;
            when others then
              if position('role tidak dapat diubah' in sqlerrm) = 0 then raise; end if;
  end;
end $$;

-- Quiz answer keys must not be readable with a user token.
do $$
begin
  begin
    perform 1 from public.quiz_questions limit 1;
    raise exception 'FAIL: authenticated user can read quiz_questions';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.quizzes limit 1;
    raise exception 'FAIL: authenticated user can read quizzes';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Progress writes are server-only.
do $$
begin
  begin
    insert into public.lesson_progress (user_id, course_id, lesson_id)
    select '11111111-1111-4111-8111-111111111111', course_id, id
    from public.lessons limit 1;
    raise exception 'FAIL: authenticated user can write lesson_progress directly';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Cross-user AI conversation isolation.
insert into public.ai_conversations (id, user_id, title)
values ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Percakapan A');

do $$
begin
  if (select count(*) from public.ai_conversations) <> 1 then
    raise exception 'FAIL: user A cannot see own conversation';
  end if;
end $$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);

do $$
begin
  if (select count(*) from public.ai_conversations) <> 0 then
    raise exception 'FAIL: user B can see user A conversations';
  end if;
  begin
    insert into public.ai_messages (conversation_id, user_id, role, content)
    values ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'user', 'halo');
    raise exception 'FAIL: user B can write into user A conversation';
  exception when insufficient_privilege then null;
            when others then
              if position('row-level security' in sqlerrm) = 0 then raise; end if;
  end;
end $$;

-- Server-side operations (service role simulation) ---------------------------
reset role;
set role service_role;

insert into public.lesson_progress (user_id, course_id, lesson_id)
select '11111111-1111-4111-8111-111111111111', course_id, id
from public.lessons order by position limit 1;

insert into public.certificates (
  user_id, course_id, certificate_number, verification_code,
  recipient_name, course_title_snapshot, final_score
)
select
  '11111111-1111-4111-8111-111111111111',
  id,
  'LC-2026-ABCDEFGH',
  'verification_code_test_123',
  'Pengguna A',
  title,
  92
from public.courses order by position limit 1;

do $$
declare
  new_count integer;
begin
  select message_count into new_count from public.consume_ai_message('11111111-1111-4111-8111-111111111111');
  if new_count <> 1 then
    raise exception 'FAIL: consume_ai_message did not return 1 on first call';
  end if;
  select message_count into new_count from public.consume_ai_message('11111111-1111-4111-8111-111111111111');
  if new_count <> 2 then
    raise exception 'FAIL: consume_ai_message is not atomic/incremental';
  end if;
end $$;

-- Duplicate certificate for the same user+course is impossible.
do $$
begin
  begin
    insert into public.certificates (
      user_id, course_id, certificate_number, verification_code,
      recipient_name, course_title_snapshot, final_score
    )
    select
      '11111111-1111-4111-8111-111111111111', id, 'LC-2026-IJKLMNOP',
      'verification_code_test_456', 'Pengguna A', title, 92
    from public.courses order by position limit 1;
    raise exception 'FAIL: duplicate certificate was accepted';
  exception when unique_violation then null;
  end;
end $$;

-- Invalid certificate number format is rejected.
do $$
begin
  begin
    insert into public.certificates (
      user_id, course_id, certificate_number, verification_code,
      recipient_name, course_title_snapshot, final_score
    )
    select
      '11111111-1111-4111-8111-111111111111', id, 'INVALID-NUMBER',
      'verification_code_test_789', 'Pengguna A', title, 92
    from public.courses order by position desc limit 1;
    raise exception 'FAIL: invalid certificate number format was accepted';
  exception when check_violation then null;
  end;
end $$;

-- Certificate visibility for owners only.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
begin
  if (select count(*) from public.certificates) <> 1 then
    raise exception 'FAIL: user A cannot read own certificate';
  end if;
  begin
    insert into public.certificates (
      user_id, course_id, certificate_number, verification_code,
      recipient_name, course_title_snapshot, final_score
    )
    select '11111111-1111-4111-8111-111111111111', id, 'LC-2026-ZZZZZZZZ',
      'verification_code_test_999', 'Pengguna A', title, 100
    from public.courses limit 1;
    raise exception 'FAIL: authenticated user can insert a certificate';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);

do $$
begin
  if (select count(*) from public.certificates) <> 0 then
    raise exception 'FAIL: user B can read user A certificate';
  end if;
end $$;

-- AI quota function is not callable by users.
do $$
begin
  begin
    perform public.consume_ai_message('22222222-2222-4222-8222-222222222222');
    raise exception 'FAIL: authenticated user can consume AI quota directly';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Admin panel policies
-- ---------------------------------------------------------------------------

reset role;

-- New signups are always plain users. Auth-provider writes happen with the
-- owner role, exactly like GoTrue does inside Supabase.
insert into auth.users (id, email, raw_user_meta_data)
values ('33333333-3333-4333-8333-333333333333', 'c@example.test', '{"full_name":"Pengguna C"}'::jsonb)
on conflict (id) do nothing;

do $$
begin
  if (select role from public.profiles where id = '33333333-3333-4333-8333-333333333333') <> 'user' then
    raise exception 'FAIL: new signup did not get the user role';
  end if;
end $$;

-- Trusted server code (service role) seeds a draft course and one audit row.
set role service_role;
select set_config('request.jwt.claim.sub', '', false);

insert into public.courses (slug, title, status)
values ('admin-rls-draft', 'Kursus draft untuk uji RLS', 'draft')
on conflict (slug) do nothing;

insert into public.admin_audit_logs (actor_email, action, target_type, target_id)
values ('rls@example.test', 'course.created', 'course', 'admin-rls-draft');

-- Normal users cannot see admin-only data.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
begin
  if (select count(*) from public.courses) <> 3 then
    raise exception 'FAIL: normal user can read draft courses';
  end if;
  if (select count(*) from public.ai_settings) <> 0 then
    raise exception 'FAIL: normal user can read ai_settings';
  end if;
  if (select count(*) from public.admin_audit_logs) <> 0 then
    raise exception 'FAIL: normal user can read the admin audit log';
  end if;
  if (select count(*) from public.blog_posts) <> 10 then
    raise exception 'FAIL: normal user can read unpublished blog posts';
  end if;
  if (select count(*) from public.blog_posts where slug = 'rls-draft-post') <> 0 then
    raise exception 'FAIL: normal user can read a draft blog post';
  end if;
  begin
    update public.courses set title = 'Hacked' where slug = 'admin-rls-draft';
    raise exception 'FAIL: normal user can update courses';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.admin_audit_logs (actor_email, action, target_type)
    values ('a@example.test', 'course.created', 'course');
    raise exception 'FAIL: normal user can append audit rows';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Promote user B through the trusted bootstrap helper (owner-only).
-- The owner runs this outside any end-user request, so no JWT claim is set.
reset role;
select set_config('request.jwt.claim.sub', '', false);
select public.bootstrap_admin('b@example.test');

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);

do $$
begin
  if (select count(*) from public.courses) <> 4 then
    raise exception 'FAIL: admin cannot read draft courses';
  end if;
  if (select count(*) from public.ai_settings) <> 1 then
    raise exception 'FAIL: admin cannot read ai_settings';
  end if;
  if (select count(*) from public.admin_audit_logs where action = 'course.created') < 1 then
    raise exception 'FAIL: admin cannot read the audit log';
  end if;
  if (select count(*) from public.profiles) <> 3 then
    raise exception 'FAIL: admin should see every profile';
  end if;
  if (select count(*) from public.blog_posts) <> 11 then
    raise exception 'FAIL: admin cannot read the unpublished blog draft';
  end if;
  if (select count(*) from public.blog_posts where slug = 'rls-draft-post') <> 1 then
    raise exception 'FAIL: admin cannot read the draft blog post';
  end if;
  begin
    update public.blog_posts set title = 'Perubahan langsung' where slug = 'html-struktur-semantik';
    raise exception 'FAIL: admin client role can mutate blog posts directly';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.ai_settings set daily_message_limit = 5 where id = 1;
    raise exception 'FAIL: admin can write ai_settings directly from a client role';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Suspending the admin immediately removes admin privileges.
reset role;
update public.profiles
set suspended_at = now(), suspended_reason = 'uji RLS'
where id = '22222222-2222-4222-8222-222222222222';

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);

do $$
begin
  if public.is_admin() then
    raise exception 'FAIL: suspended admin still reports is_admin';
  end if;
  if (select count(*) from public.courses) <> 3 then
    raise exception 'FAIL: suspended admin still reads draft courses';
  end if;
  if (select count(*) from public.admin_audit_logs) <> 0 then
    raise exception 'FAIL: suspended admin still reads the audit log';
  end if;
  if (select count(*) from public.blog_posts) <> 10 then
    raise exception 'FAIL: suspended admin still reads unpublished blog posts';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Admin panel: role-gated reads and append-only audit trail
-- ---------------------------------------------------------------------------

-- A learner cannot read admin-only tables.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
begin
  if (select count(*) from public.ai_settings) <> 0 then
    raise exception 'FAIL: learner can read ai_settings';
  end if;
  if (select count(*) from public.admin_audit_logs) <> 0 then
    raise exception 'FAIL: learner can read admin_audit_logs';
  end if;
  if public.is_admin() then
    raise exception 'FAIL: learner reports is_admin()';
  end if;
end $$;

-- Promote user B through the documented owner-level procedure. An earlier
-- block suspended this account, so promotion also clears the suspension.
reset role;
update public.profiles
set role = 'admin', suspended_at = null, suspended_reason = null, suspended_by = null
where id = '22222222-2222-4222-8222-222222222222';

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);

do $$
begin
  if not public.is_admin() then
    raise exception 'FAIL: admin role is not recognised by is_admin()';
  end if;
  if (select count(*) from public.ai_settings) <> 1 then
    raise exception 'FAIL: admin cannot read ai_settings';
  end if;
  if (select count(*) from public.admin_audit_logs) < 1 then
    raise exception 'FAIL: admin cannot read the audit trail';
  end if;
  begin
    insert into public.admin_audit_logs (action, target_type, target_id)
    values ('course.created', 'course', 'rls-test');
    raise exception 'FAIL: admin can append audit rows without an action';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Suspension removes admin privileges without deleting the account.
reset role;
update public.profiles set suspended_at = now(), suspended_reason = 'uji RLS'
where id = '22222222-2222-4222-8222-222222222222';

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);

do $$
begin
  if public.is_admin() then
    raise exception 'FAIL: suspended admin still reports is_admin()';
  end if;
  if (select count(*) from public.ai_settings) <> 0 then
    raise exception 'FAIL: suspended admin can still read ai_settings';
  end if;
end $$;

-- The audit trail is immutable, even for the table owner: the trigger raises
-- "admin_audit_logs bersifat append-only" for both UPDATE and DELETE.
reset role;
do $$
declare
  blocked boolean;
begin
  blocked := false;
  begin
    update public.admin_audit_logs set action = 'course.updated';
  exception when raise_exception then
    if sqlerrm not like '%append-only%' then raise; end if;
    blocked := true;
  end;
  if not blocked then
    raise exception 'FAIL: audit rows can be updated';
  end if;

  blocked := false;
  begin
    delete from public.admin_audit_logs;
  exception when raise_exception then
    if sqlerrm not like '%append-only%' then raise; end if;
    blocked := true;
  end;
  if not blocked then
    raise exception 'FAIL: audit rows can be deleted';
  end if;
end $$;

reset role;
select 'ALL DATABASE ASSERTIONS PASSED' as result;
