-- Harden authentication helpers, RLS policies and evidence storage.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_approved_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.active = true
        and p.account_status = 'aprovado'
    ),
    false
  );
$$;

create or replace function private.can_manage_gip()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.active = true
        and p.account_status = 'aprovado'
        and (
          p.role in ('administrador', 'professor_coordenador')
          or exists (
            select 1
            from public.profile_permissions pp
            where pp.profile_id = p.id
              and pp.permission = 'gerenciar_usuarios'
          )
        )
    ),
    false
  );
$$;

create or replace function private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function private.has_permission(required_permission public.app_permission)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.active = true
        and p.account_status = 'aprovado'
        and (
          p.role = 'administrador'
          or exists (
            select 1
            from public.profile_permissions pp
            where pp.profile_id = p.id
              and pp.permission = required_permission
          )
        )
    ),
    false
  );
$$;

revoke all on function private.is_approved_user() from public;
revoke all on function private.can_manage_gip() from public;
revoke all on function private.current_user_role() from public;
revoke all on function private.has_permission(public.app_permission) from public;
grant execute on function private.is_approved_user() to authenticated;
grant execute on function private.can_manage_gip() to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.has_permission(public.app_permission) to authenticated;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security invoker
set search_path = ''
as $$
  select private.current_user_role();
$$;

create or replace function public.can_manage_gip()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.can_manage_gip();
$$;

create or replace function public.has_permission(required_permission public.app_permission)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_permission(required_permission);
$$;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.can_manage_gip() from public, anon;
revoke all on function public.has_permission(public.app_permission) from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.can_manage_gip() to authenticated;
grant execute on function public.has_permission(public.app_permission) to authenticated;

drop function if exists public.claim_first_admin();

alter function public.set_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.id and not private.can_manage_gip() then
    if new.role is distinct from old.role
       or new.organization_id is distinct from old.organization_id
       or new.active is distinct from old.active
       or new.account_status is distinct from old.account_status then
      raise exception 'Usuarios comuns nao podem alterar papel, organizacao, aprovacao ou estado ativo.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_privileges() from public, anon, authenticated;

drop policy if exists organizations_read_authenticated on public.organizations;
drop policy if exists organizations_manage on public.organizations;
create policy organizations_read_approved on public.organizations for select to authenticated
  using ((select private.is_approved_user()));
create policy organizations_insert_manager on public.organizations for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy organizations_update_manager on public.organizations for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy organizations_delete_manager on public.organizations for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists health_units_read_authenticated on public.health_units;
drop policy if exists health_units_manage on public.health_units;
create policy health_units_read_approved on public.health_units for select to authenticated
  using ((select private.is_approved_user()));
create policy health_units_insert_manager on public.health_units for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy health_units_update_manager on public.health_units for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy health_units_delete_manager on public.health_units for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists profiles_read_self_or_manager on public.profiles;
drop policy if exists profiles_update_self_or_manager on public.profiles;
drop policy if exists profiles_insert_manager on public.profiles;
drop policy if exists profiles_delete_manager on public.profiles;
create policy profiles_read_self_or_manager on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.can_manage_gip()));
create policy profiles_update_self_or_manager on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.can_manage_gip()))
  with check (id = (select auth.uid()) or (select private.can_manage_gip()));
create policy profiles_insert_manager on public.profiles for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy profiles_delete_manager on public.profiles for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists cycles_read_authenticated on public.program_cycles;
drop policy if exists cycles_manage on public.program_cycles;
create policy cycles_read_approved on public.program_cycles for select to authenticated
  using ((select private.is_approved_user()));
create policy cycles_insert_manager on public.program_cycles for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy cycles_update_manager on public.program_cycles for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy cycles_delete_manager on public.program_cycles for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists members_read_self_or_manager on public.program_members;
drop policy if exists members_manage on public.program_members;
create policy members_read_self_or_manager on public.program_members for select to authenticated
  using (
    (select private.is_approved_user())
    and (profile_id = (select auth.uid()) or (select private.can_manage_gip()))
  );
create policy members_insert_manager on public.program_members for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy members_update_manager on public.program_members for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy members_delete_manager on public.program_members for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists modules_read_authenticated on public.training_modules;
drop policy if exists modules_manage on public.training_modules;
create policy modules_read_approved on public.training_modules for select to authenticated
  using ((select private.is_approved_user()) and (active or (select private.can_manage_gip())));
create policy modules_insert_manager on public.training_modules for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy modules_update_manager on public.training_modules for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy modules_delete_manager on public.training_modules for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists classes_read_authenticated on public.training_classes;
drop policy if exists classes_manage on public.training_classes;
create policy classes_read_approved on public.training_classes for select to authenticated
  using ((select private.is_approved_user()));
create policy classes_insert_manager on public.training_classes for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy classes_update_manager on public.training_classes for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy classes_delete_manager on public.training_classes for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists enrollments_read_self_or_manager on public.training_enrollments;
drop policy if exists enrollments_manage on public.training_enrollments;
create policy enrollments_read_self_or_manager on public.training_enrollments for select to authenticated
  using (
    (select private.is_approved_user())
    and (
      (select private.can_manage_gip())
      or exists (
        select 1 from public.program_members pm
        where pm.id = member_id and pm.profile_id = (select auth.uid())
      )
    )
  );
create policy enrollments_insert_manager on public.training_enrollments for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy enrollments_update_manager on public.training_enrollments for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy enrollments_delete_manager on public.training_enrollments for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists attendance_read_self_or_manager on public.attendance_records;
drop policy if exists attendance_manage on public.attendance_records;
create policy attendance_read_self_or_manager on public.attendance_records for select to authenticated
  using (
    (select private.is_approved_user())
    and (
      (select private.can_manage_gip())
      or exists (
        select 1
        from public.training_enrollments te
        join public.program_members pm on pm.id = te.member_id
        where te.id = enrollment_id and pm.profile_id = (select auth.uid())
      )
    )
  );
create policy attendance_insert_manager on public.attendance_records for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy attendance_update_manager on public.attendance_records for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy attendance_delete_manager on public.attendance_records for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists activities_read_authenticated on public.activities;
drop policy if exists activities_manage on public.activities;
create policy activities_read_approved on public.activities for select to authenticated
  using ((select private.is_approved_user()));
create policy activities_insert_manager on public.activities for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy activities_update_manager on public.activities for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy activities_delete_manager on public.activities for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists evidences_read on public.evidences;
drop policy if exists evidences_insert on public.evidences;
drop policy if exists evidences_update on public.evidences;
drop policy if exists evidences_delete on public.evidences;
create policy evidences_read on public.evidences for select to authenticated
  using (
    (select private.is_approved_user())
    and (is_public or uploaded_by = (select auth.uid()) or (select private.can_manage_gip()))
  );
create policy evidences_insert on public.evidences for insert to authenticated
  with check (
    (select private.is_approved_user())
    and (uploaded_by = (select auth.uid()) or (select private.can_manage_gip()))
  );
create policy evidences_update on public.evidences for update to authenticated
  using (
    (select private.is_approved_user())
    and (uploaded_by = (select auth.uid()) or (select private.can_manage_gip()))
  )
  with check (
    (select private.is_approved_user())
    and (uploaded_by = (select auth.uid()) or (select private.can_manage_gip()))
  );
create policy evidences_delete on public.evidences for delete to authenticated
  using (
    (select private.is_approved_user())
    and (uploaded_by = (select auth.uid()) or (select private.can_manage_gip()))
  );

drop policy if exists audit_logs_read_manager on public.audit_logs;
drop policy if exists audit_logs_insert_authenticated on public.audit_logs;
create policy audit_logs_read_manager on public.audit_logs for select to authenticated
  using ((select private.can_manage_gip()));
create policy audit_logs_insert_authenticated on public.audit_logs for insert to authenticated
  with check ((select private.is_approved_user()) and actor_id = (select auth.uid()));

drop policy if exists profile_permissions_read_self_or_manager on public.profile_permissions;
drop policy if exists profile_permissions_manage on public.profile_permissions;
create policy profile_permissions_read_self_or_manager on public.profile_permissions for select to authenticated
  using (
    (select private.is_approved_user())
    and (profile_id = (select auth.uid()) or (select private.can_manage_gip()))
  );
create policy profile_permissions_insert_manager on public.profile_permissions for insert to authenticated
  with check ((select private.can_manage_gip()));
create policy profile_permissions_update_manager on public.profile_permissions for update to authenticated
  using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy profile_permissions_delete_manager on public.profile_permissions for delete to authenticated
  using ((select private.can_manage_gip()));

drop policy if exists evidence_files_read on storage.objects;
drop policy if exists evidence_files_insert on storage.objects;
drop policy if exists evidence_files_update on storage.objects;
drop policy if exists evidence_files_delete on storage.objects;
create policy evidence_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'gip-evidencias'
    and (select private.is_approved_user())
    and (owner_id = (select auth.uid())::text or (select private.can_manage_gip()))
  );
create policy evidence_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gip-evidencias'
    and (select private.is_approved_user())
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.can_manage_gip())
    )
  );
create policy evidence_files_update on storage.objects for update to authenticated
  using (
    bucket_id = 'gip-evidencias'
    and (select private.is_approved_user())
    and (owner_id = (select auth.uid())::text or (select private.can_manage_gip()))
  )
  with check (
    bucket_id = 'gip-evidencias'
    and (select private.is_approved_user())
    and (
      (
        owner_id = (select auth.uid())::text
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
      or (select private.can_manage_gip())
    )
  );
create policy evidence_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'gip-evidencias'
    and (select private.is_approved_user())
    and (owner_id = (select auth.uid())::text or (select private.can_manage_gip()))
  );

create index if not exists idx_health_units_organization on public.health_units(organization_id);
create index if not exists idx_profiles_organization on public.profiles(organization_id);
create index if not exists idx_program_cycles_created_by on public.program_cycles(created_by);
create index if not exists idx_training_classes_instructor on public.training_classes(instructor_id);
create index if not exists idx_attendance_records_recorded_by on public.attendance_records(recorded_by);
create index if not exists idx_activities_responsible on public.activities(responsible_id);
create index if not exists idx_evidences_uploaded_by on public.evidences(uploaded_by);
create index if not exists idx_profile_permissions_granted_by on public.profile_permissions(granted_by);
