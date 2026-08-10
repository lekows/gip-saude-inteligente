-- Keep administrative invariants in the database and restrict clinical MVP data.

create or replace function public.admin_update_profile_status(
  p_target_id uuid,
  p_status public.account_status,
  p_active boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_actor_status public.account_status;
  v_actor_active boolean;
  v_target_role public.app_role;
  v_target_status public.account_status;
  v_target_active boolean;
  v_active_admins integer;
begin
  if v_actor_id is null then
    raise exception 'Autenticacao necessaria.';
  end if;

  select role, account_status, active
  into v_actor_role, v_actor_status, v_actor_active
  from public.profiles
  where id = v_actor_id;

  if v_actor_status is distinct from 'aprovado'
     or v_actor_active is not true
     or v_actor_role is distinct from 'administrador' then
    raise exception 'Acesso nao autorizado.';
  end if;

  perform pg_advisory_xact_lock(hashtext('gip_admin_profile_change'));

  select role, account_status, active
  into v_target_role, v_target_status, v_target_active
  from public.profiles
  where id = p_target_id
  for update;

  if not found then
    raise exception 'Usuario nao encontrado.';
  end if;

  if p_target_id = v_actor_id and (p_status is distinct from 'aprovado' or p_active is not true) then
    raise exception 'Um administrador nao pode suspender ou desativar a propria conta.';
  end if;

  if v_target_role = 'administrador'
     and v_target_status = 'aprovado'
     and v_target_active is true
     and (p_status is distinct from 'aprovado' or p_active is not true) then
    select count(*)
    into v_active_admins
    from public.profiles
    where role = 'administrador'
      and account_status = 'aprovado'
      and active is true;

    if v_active_admins <= 1 then
      raise exception 'Nao e possivel suspender o unico administrador ativo.';
    end if;
  end if;

  perform set_config('app.admin_profile_write', 'on', true);

  update public.profiles
  set account_status = p_status,
      active = p_active,
      updated_at = now()
  where id = p_target_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor_id,
    'update_status',
    'profile',
    p_target_id::text,
    jsonb_build_object('status', p_status, 'active', p_active)
  );

  return true;
end;
$$;

create or replace function public.admin_update_profile_role(
  p_target_id uuid,
  p_role public.app_role
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_actor_status public.account_status;
  v_actor_active boolean;
  v_target_role public.app_role;
  v_target_status public.account_status;
  v_target_active boolean;
  v_active_admins integer;
begin
  if v_actor_id is null then
    raise exception 'Autenticacao necessaria.';
  end if;

  select role, account_status, active
  into v_actor_role, v_actor_status, v_actor_active
  from public.profiles
  where id = v_actor_id;

  if v_actor_status is distinct from 'aprovado'
     or v_actor_active is not true
     or v_actor_role is distinct from 'administrador' then
    raise exception 'Acesso nao autorizado.';
  end if;

  perform pg_advisory_xact_lock(hashtext('gip_admin_profile_change'));

  select role, account_status, active
  into v_target_role, v_target_status, v_target_active
  from public.profiles
  where id = p_target_id
  for update;

  if not found then
    raise exception 'Usuario nao encontrado.';
  end if;

  if p_target_id = v_actor_id and p_role is distinct from 'administrador' then
    raise exception 'Um administrador nao pode alterar o proprio papel.';
  end if;

  if v_target_role = 'administrador'
     and v_target_status = 'aprovado'
     and v_target_active is true
     and p_role is distinct from 'administrador' then
    select count(*)
    into v_active_admins
    from public.profiles
    where role = 'administrador'
      and account_status = 'aprovado'
      and active is true;

    if v_active_admins <= 1 then
      raise exception 'Nao e possivel rebaixar o unico administrador ativo.';
    end if;
  end if;

  perform set_config('app.admin_profile_write', 'on', true);

  update public.profiles
  set role = p_role,
      updated_at = now()
  where id = p_target_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor_id,
    'update_role',
    'profile',
    p_target_id::text,
    jsonb_build_object('role', p_role)
  );

  return true;
end;
$$;

revoke all on function public.admin_update_profile_status(uuid, public.account_status, boolean) from public, anon;
revoke all on function public.admin_update_profile_role(uuid, public.app_role) from public, anon;
grant execute on function public.admin_update_profile_status(uuid, public.account_status, boolean) to authenticated;
grant execute on function public.admin_update_profile_role(uuid, public.app_role) to authenticated;

alter table public.clinical_screenings
  drop column if exists patient_name,
  drop column if exists location;

alter table public.patients
  drop column if exists household_id,
  drop column if exists latitude,
  drop column if exists longitude,
  drop column if exists valid_cpf,
  drop column if exists notes;

alter table public.patients
  drop constraint if exists patients_patient_code_synthetic;
alter table public.patients
  add constraint patients_patient_code_synthetic
  check (patient_code like 'SIM-%');

alter table public.clinical_screenings
  drop constraint if exists clinical_screenings_patient_code_synthetic;
alter table public.clinical_screenings
  add constraint clinical_screenings_patient_code_synthetic
  check (patient_code is null or patient_code like 'SIM-%');

drop policy if exists patients_select_all on public.patients;
drop policy if exists patients_insert_admin on public.patients;
drop policy if exists patients_update_admin on public.patients;

create policy patients_select_manager
on public.patients for select
to authenticated
using ((select private.can_manage_gip()));

create policy patients_insert_manager
on public.patients for insert
to authenticated
with check ((select private.can_manage_gip()));

create policy patients_update_manager
on public.patients for update
to authenticated
using ((select private.can_manage_gip()))
with check ((select private.can_manage_gip()));

drop policy if exists screenings_select_all on public.clinical_screenings;
drop policy if exists screenings_insert_any on public.clinical_screenings;
drop policy if exists screenings_update_own on public.clinical_screenings;

create policy screenings_select_own_or_manager
on public.clinical_screenings for select
to authenticated
using (
  (select private.is_approved_user())
  and (recorded_by = (select auth.uid()) or (select private.can_manage_gip()))
);

create policy screenings_insert_approved
on public.clinical_screenings for insert
to authenticated
with check (
  (select private.is_approved_user())
  and recorded_by = (select auth.uid())
);

create policy screenings_update_own_or_manager
on public.clinical_screenings for update
to authenticated
using (
  (select private.is_approved_user())
  and (recorded_by = (select auth.uid()) or (select private.can_manage_gip()))
)
with check (
  (select private.is_approved_user())
  and (recorded_by = (select auth.uid()) or (select private.can_manage_gip()))
);

revoke all on table public.patients from anon;
revoke all on table public.clinical_screenings from anon;
grant select, insert, update on table public.patients to authenticated;
grant select, insert, update on table public.clinical_screenings to authenticated;

create index if not exists idx_patients_health_unit on public.patients(health_unit_id);
create index if not exists idx_clinical_screenings_activity on public.clinical_screenings(activity_id);
create index if not exists idx_clinical_screenings_health_unit on public.clinical_screenings(health_unit_id);
create index if not exists idx_clinical_screenings_recorded_by on public.clinical_screenings(recorded_by);
