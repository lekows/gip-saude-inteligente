-- Require privileged profile fields to be changed through audited admin RPCs.

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     or new.organization_id is distinct from old.organization_id
     or new.active is distinct from old.active
     or new.account_status is distinct from old.account_status then
    if coalesce(current_setting('app.admin_profile_write', true), '') is distinct from 'on' then
      raise exception 'Papel, organizacao, aprovacao e ativacao so podem ser alterados pelas funcoes administrativas auditadas.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_privileges() from public, anon, authenticated;

create or replace function public.admin_update_profile_status(
  p_target_id uuid,
  p_status public.account_status,
  p_active boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_actor_status public.account_status;
  v_actor_active boolean;
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

  perform set_config('app.admin_profile_write', 'on', true);

  update public.profiles
  set account_status = p_status,
      active = p_active,
      updated_at = now()
  where id = p_target_id;

  if not found then
    raise exception 'Usuario nao encontrado.';
  end if;

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
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_actor_status public.account_status;
  v_actor_active boolean;
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

  perform set_config('app.admin_profile_write', 'on', true);

  update public.profiles
  set role = p_role,
      updated_at = now()
  where id = p_target_id;

  if not found then
    raise exception 'Usuario nao encontrado.';
  end if;

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
