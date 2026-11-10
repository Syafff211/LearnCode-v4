-- ---------------------------------------------------------------------------
-- Admin ordering helpers
--
-- `unique (course_id, position)` and `unique (quiz_id, position)` make a naive
-- row-by-row reorder fail halfway. These SECURITY DEFINER functions renumber
-- inside one transaction using a negative staging range, so a reorder is
-- atomic: either every row moves or nothing changes.
-- Parameters are validated server-side and the functions are executable only
-- by the service role (trusted server code), never by browser clients.
-- ---------------------------------------------------------------------------

create or replace function public.admin_reorder_lessons(
  p_course_id uuid,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_match integer;
begin
  if p_ordered_ids is null or array_length(p_ordered_ids, 1) is null then
    raise exception 'ordered_ids_kosong';
  end if;

  select count(*) into v_count
  from public.lessons l
  where l.course_id = p_course_id;

  select count(distinct id) into v_match
  from unnest(p_ordered_ids) as t(id)
  where id in (select l.id from public.lessons l where l.course_id = p_course_id);

  if v_count <> array_length(p_ordered_ids, 1) or v_match <> v_count then
    raise exception 'urutan_tidak_lengkap';
  end if;

  -- Stage: negative positions cannot collide with the 1..n range.
  update public.lessons l
  set position = -1 * t.ord
  from unnest(p_ordered_ids) with ordinality as t(id, ord)
  where l.id = t.id;

  update public.lessons l
  set position = t.ord
  from unnest(p_ordered_ids) with ordinality as t(id, ord)
  where l.id = t.id;
end;
$$;

create or replace function public.admin_reorder_questions(
  p_quiz_id uuid,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_match integer;
begin
  if p_ordered_ids is null or array_length(p_ordered_ids, 1) is null then
    raise exception 'ordered_ids_kosong';
  end if;

  select count(*) into v_count
  from public.quiz_questions q
  where q.quiz_id = p_quiz_id;

  select count(distinct id) into v_match
  from unnest(p_ordered_ids) as t(id)
  where id in (select q.id from public.quiz_questions q where q.quiz_id = p_quiz_id);

  if v_count <> array_length(p_ordered_ids, 1) or v_match <> v_count then
    raise exception 'urutan_tidak_lengkap';
  end if;

  update public.quiz_questions q
  set position = -1 * t.ord
  from unnest(p_ordered_ids) with ordinality as t(id, ord)
  where q.id = t.id;

  update public.quiz_questions q
  set position = t.ord
  from unnest(p_ordered_ids) with ordinality as t(id, ord)
  where q.id = t.id;
end;
$$;

revoke all on function public.admin_reorder_lessons(uuid, uuid[]) from public;
revoke all on function public.admin_reorder_lessons(uuid, uuid[]) from anon;
revoke all on function public.admin_reorder_lessons(uuid, uuid[]) from authenticated;
grant execute on function public.admin_reorder_lessons(uuid, uuid[]) to service_role;

revoke all on function public.admin_reorder_questions(uuid, uuid[]) from public;
revoke all on function public.admin_reorder_questions(uuid, uuid[]) from anon;
revoke all on function public.admin_reorder_questions(uuid, uuid[]) from authenticated;
grant execute on function public.admin_reorder_questions(uuid, uuid[]) to service_role;
