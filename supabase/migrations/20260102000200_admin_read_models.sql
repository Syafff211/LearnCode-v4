-- ---------------------------------------------------------------------------
-- Admin read models
--
-- The admin UI needs joins the REST API cannot express (auth.users emails,
-- grouped participant counts, aggregate quiz results). These functions do the
-- aggregation in one round trip, live in the database, and are executable only
-- by the service role. The Next.js server verifies the admin session before
-- calling them; browsers never get access to them.
-- ---------------------------------------------------------------------------

create or replace function public.admin_dashboard_stats(p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with participant_set as (
    select lp.user_id from public.lesson_progress lp
    union
    select qa.user_id from public.quiz_attempts qa
  ),
  period as (
    select greatest(1, least(coalesce(p_days, 30), 365)) as days
  )
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'users_suspended', (select count(*) from public.profiles p where p.suspended_at is not null),
    'admins', (select count(*) from public.profiles p where p.role = 'admin'),
    'courses_total', (select count(*) from public.courses),
    'courses_published', (select count(*) from public.courses c where c.status = 'published'),
    'courses_draft', (select count(*) from public.courses c where c.status = 'draft'),
    'courses_archived', (select count(*) from public.courses c where c.status = 'archived'),
    'lessons_total', (select count(*) from public.lessons),
    'lessons_published', (select count(*) from public.lessons l where l.status = 'published'),
    'quizzes_total', (select count(*) from public.quizzes),
    'participants', (select count(*) from participant_set),
    'completions', (select count(distinct ct.user_id || ':' || ct.course_id) from public.certificates ct),
    'certificates', (select count(*) from public.certificates),
    'certificates_revoked', (select count(*) from public.certificates ct where ct.revoked_at is not null),
    'ai_messages', (
      select coalesce(sum(u.message_count), 0)
      from public.ai_usage u, period
      where u.usage_date >= current_date - (period.days - 1)
    ),
    'ai_users', (
      select count(distinct u.user_id)
      from public.ai_usage u, period
      where u.usage_date >= current_date - (period.days - 1)
    ),
    'period_days', (select days from period),
    'recent_activity', coalesce(
      (
        select jsonb_agg(row_to_json(t) order by t.created_at desc)
        from (
          select a.id, a.actor_email, a.action, a.target_type, a.target_id,
                 a.reason, a.created_at
          from public.admin_audit_logs a
          order by a.created_at desc
          limit 8
        ) t
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.admin_course_list(
  p_search text default '',
  p_status text default 'all',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  level text,
  language text,
  status text,
  duration_minutes integer,
  sort_order integer,
  lessons_count bigint,
  required_lessons_count bigint,
  participants bigint,
  certificates bigint,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select c.*
    from public.courses c
    where (coalesce(p_status, 'all') = 'all' or c.status = p_status)
      and (
        coalesce(trim(p_search), '') = ''
        or c.title ilike '%' || trim(p_search) || '%'
        or c.slug ilike '%' || trim(p_search) || '%'
      )
  ),
  counted as (
    select count(*) as total from filtered
  ),
  page as (
    select f.*
    from filtered f
    order by f.position asc, f.created_at asc
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    p.id, p.slug, p.title, p.level, p.language, p.status,
    p.duration_minutes, p.position as sort_order,
    (select count(*) from public.lessons l where l.course_id = p.id) as lessons_count,
    (select count(*) from public.lessons l where l.course_id = p.id and l.required) as required_lessons_count,
    (
      select count(distinct x.user_id)
      from (
        select lp.user_id from public.lesson_progress lp where lp.course_id = p.id
        union
        select qa.user_id from public.quiz_attempts qa where qa.course_id = p.id
      ) x
    ) as participants,
    (select count(*) from public.certificates ct where ct.course_id = p.id) as certificates,
    p.updated_at,
    (select total from counted) as total_count
  from page p;
$$;

create or replace function public.admin_user_list(
  p_search text default '',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  created_at timestamptz,
  suspended_at timestamptz,
  suspended_reason text,
  courses_started bigint,
  lessons_completed bigint,
  quiz_attempts bigint,
  certificates bigint,
  ai_messages bigint,
  last_activity timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select p.id
    from public.profiles p
    left join auth.users u on u.id = p.id
    where coalesce(trim(p_search), '') = ''
      or p.full_name ilike '%' || trim(p_search) || '%'
      or u.email ilike '%' || trim(p_search) || '%'
  ),
  counted as (
    select count(*) as total from filtered
  ),
  page as (
    select f.id
    from filtered f
    join public.profiles p2 on p2.id = f.id
    order by p2.created_at desc
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    p.id,
    p.full_name,
    coalesce(u.email, '') as email,
    p.role,
    p.created_at,
    p.suspended_at,
    p.suspended_reason,
    (select count(distinct lp.course_id) from public.lesson_progress lp where lp.user_id = p.id) as courses_started,
    (select count(*) from public.lesson_progress lp where lp.user_id = p.id) as lessons_completed,
    (select count(*) from public.quiz_attempts qa where qa.user_id = p.id) as quiz_attempts,
    (select count(*) from public.certificates ct where ct.user_id = p.id) as certificates,
    (select coalesce(sum(au.message_count), 0) from public.ai_usage au where au.user_id = p.id) as ai_messages,
    greatest(
      coalesce((select max(lp.completed_at) from public.lesson_progress lp where lp.user_id = p.id), '-infinity'::timestamptz),
      coalesce((select max(qa.created_at) from public.quiz_attempts qa where qa.user_id = p.id), '-infinity'::timestamptz),
      p.created_at
    ) as last_activity,
    (select total from counted) as total_count
  from page pg
  join public.profiles p on p.id = pg.id
  left join auth.users u on u.id = p.id
  order by p.created_at desc;
$$;

create or replace function public.admin_user_detail(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'user', (
      select jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', coalesce(u.email, ''),
        'role', p.role,
        'created_at', p.created_at,
        'suspended_at', p.suspended_at,
        'suspended_reason', p.suspended_reason,
        'preferred_language', p.preferred_language
      )
      from public.profiles p
      left join auth.users u on u.id = p.id
      where p.id = p_user_id
    ),
    'courses', coalesce(
      (
        select jsonb_agg(row_to_json(t) order by t.course_title)
        from (
          select
            c.id as course_id,
            c.title as course_title,
            c.slug as course_slug,
            (select count(*) from public.lessons l where l.course_id = c.id) as total_lessons,
            (select count(*) from public.lesson_progress lp
              where lp.user_id = p_user_id and lp.course_id = c.id) as completed_lessons,
            (select max(qa.score) from public.quiz_attempts qa
              where qa.user_id = p_user_id and qa.course_id = c.id) as best_score,
            (select ct.certificate_number from public.certificates ct
              where ct.user_id = p_user_id and ct.course_id = c.id limit 1) as certificate_number,
            (select ct.revoked_at from public.certificates ct
              where ct.user_id = p_user_id and ct.course_id = c.id limit 1) as revoked_at
          from public.courses c
          where exists (
            select 1 from public.lesson_progress lp2
            where lp2.user_id = p_user_id and lp2.course_id = c.id
            union all
            select 1 from public.quiz_attempts qa2
            where qa2.user_id = p_user_id and qa2.course_id = c.id
            union all
            select 1 from public.certificates ct2
            where ct2.user_id = p_user_id and ct2.course_id = c.id
          )
        ) t
      ),
      '[]'::jsonb
    ),
    'attempts', coalesce(
      (
        select jsonb_agg(row_to_json(t) order by t.created_at desc)
        from (
          select qa.id, qa.score, qa.passed, qa.correct_count, qa.question_count,
                 qa.created_at, c.title as course_title, c.slug as course_slug
          from public.quiz_attempts qa
          join public.courses c on c.id = qa.course_id
          where qa.user_id = p_user_id
          order by qa.created_at desc
          limit 20
        ) t
      ),
      '[]'::jsonb
    ),
    'certificates', coalesce(
      (
        select jsonb_agg(row_to_json(t) order by t.issued_at desc)
        from (
          select ct.id, ct.certificate_number, ct.verification_code,
                 ct.course_title_snapshot, ct.final_score, ct.issued_at,
                 ct.revoked_at, ct.revocation_reason
          from public.certificates ct
          where ct.user_id = p_user_id
          order by ct.issued_at desc
        ) t
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.admin_certificate_list(
  p_search text default '',
  p_status text default 'all',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  certificate_number text,
  verification_code text,
  recipient_name text,
  recipient_email text,
  course_title text,
  final_score integer,
  issued_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select ct.*
    from public.certificates ct
    left join auth.users u on u.id = ct.user_id
    where
      case coalesce(p_status, 'all')
        when 'revoked' then ct.revoked_at is not null
        when 'valid' then ct.revoked_at is null
        else true
      end
      and (
        coalesce(trim(p_search), '') = ''
        or ct.certificate_number ilike '%' || trim(p_search) || '%'
        or ct.recipient_name ilike '%' || trim(p_search) || '%'
        or ct.course_title_snapshot ilike '%' || trim(p_search) || '%'
        or u.email ilike '%' || trim(p_search) || '%'
      )
  ),
  counted as (select count(*) as total from filtered),
  page as (
    select f.* from filtered f
    order by f.issued_at desc
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    pg.id, pg.certificate_number, pg.verification_code,
    pg.recipient_name,
    coalesce(u.email, '') as recipient_email,
    pg.course_title_snapshot as course_title,
    pg.final_score, pg.issued_at, pg.revoked_at, pg.revocation_reason,
    (select total from counted) as total_count
  from page pg
  left join auth.users u on u.id = pg.user_id
  order by pg.issued_at desc;
$$;

create or replace function public.admin_quiz_attempts(
  p_quiz_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'quiz', (
      select jsonb_build_object(
        'id', q.id,
        'title', q.title,
        'passing_score', q.passing_score,
        'required', q.required,
        'course_id', q.course_id,
        'course_title', c.title,
        'course_slug', c.slug
      )
      from public.quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = p_quiz_id
    ),
    'summary', (
      select jsonb_build_object(
        'attempts', count(*),
        'participants', count(distinct qa.user_id),
        'passed', count(*) filter (where qa.passed),
        'average_score', coalesce(round(avg(qa.score)), 0)
      )
      from public.quiz_attempts qa
      where qa.quiz_id = p_quiz_id
    ),
    'attempts', coalesce(
      (
        select jsonb_agg(row_to_json(t) order by t.created_at desc)
        from (
          select qa.id, qa.score, qa.passed, qa.correct_count, qa.question_count,
                 qa.created_at, coalesce(p.full_name, '') as full_name,
                 coalesce(u.email, '') as email
          from public.quiz_attempts qa
          left join public.profiles p on p.id = qa.user_id
          left join auth.users u on u.id = qa.user_id
          where qa.quiz_id = p_quiz_id
          order by qa.created_at desc
          limit greatest(1, least(coalesce(p_limit, 20), 100))
          offset greatest(0, coalesce(p_offset, 0))
        ) t
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.admin_dashboard_stats(integer) from public, anon, authenticated;
revoke all on function public.admin_course_list(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_user_list(text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_user_detail(uuid) from public, anon, authenticated;
revoke all on function public.admin_certificate_list(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_quiz_attempts(uuid, integer, integer) from public, anon, authenticated;

grant execute on function public.admin_dashboard_stats(integer) to service_role;
grant execute on function public.admin_course_list(text, text, integer, integer) to service_role;
grant execute on function public.admin_user_list(text, integer, integer) to service_role;
grant execute on function public.admin_user_detail(uuid) to service_role;
grant execute on function public.admin_certificate_list(text, text, integer, integer) to service_role;
grant execute on function public.admin_quiz_attempts(uuid, integer, integer) to service_role;
