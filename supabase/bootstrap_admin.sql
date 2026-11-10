-- ---------------------------------------------------------------------------
-- LearnCode admin bootstrap (trusted, owner-only)
--
-- Run this once as the project owner in the Supabase SQL editor (or as the
-- postgres superuser locally) AFTER the account exists in Supabase Auth:
--
--   select public.bootstrap_admin('owner@example.com');
--
-- The function never creates accounts and never grants admin based on email
-- alone from a public request: it can only be executed by the database owner /
-- service role, and it refuses unknown or suspended accounts. Normal signup
-- always produces a `user` profile.
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_profile_id uuid;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'email_tidak_valid';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception 'akun_belum_ada: daftar dulu lewat halaman register';
  end if;

  select p.id into v_profile_id from public.profiles p where p.id = v_user_id;
  if v_profile_id is null then
    raise exception 'profil_belum_ada: cek trigger handle_new_user';
  end if;

  update public.profiles
  set role = 'admin',
      suspended_at = null,
      suspended_reason = null,
      suspended_by = null
  where id = v_user_id;

  return format('%s sekarang admin. Masuk lewat /admin.', p_email);
end;
$$;

-- Only the owner / trusted server role may execute this. Never expose it to
-- anon or authenticated clients.
revoke all on function public.bootstrap_admin(text) from public;
revoke all on function public.bootstrap_admin(text) from anon;
revoke all on function public.bootstrap_admin(text) from authenticated;
grant execute on function public.bootstrap_admin(text) to service_role;
