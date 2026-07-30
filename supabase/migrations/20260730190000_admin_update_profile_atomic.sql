-- Migration: Atomic profile status & role updates with mandatory audit logging

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
    raise exception 'Autenticação necessária.';
  end if;

  select role, account_status, active
  into v_actor_role, v_actor_status, v_actor_active
  from public.profiles
  where id = v_actor_id;

  if v_actor_status is distinct from 'aprovado' or v_actor_active is not true or v_actor_role is distinct from 'administrador' then
    raise exception 'Acesso não autorizado. Apenas administradores ativos e aprovados podem realizar esta ação.';
  end if;

  -- 1. Atualizar o perfil
  update public.profiles
  set account_status = p_status,
      active = p_active,
      updated_at = now()
  where id = p_target_id;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  -- 2. Inserir log de auditoria no mesmo bloco transacional
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
    raise exception 'Autenticação necessária.';
  end if;

  select role, account_status, active
  into v_actor_role, v_actor_status, v_actor_active
  from public.profiles
  where id = v_actor_id;

  if v_actor_status is distinct from 'aprovado' or v_actor_active is not true or v_actor_role is distinct from 'administrador' then
    raise exception 'Acesso não autorizado. Apenas administradores ativos e aprovados podem realizar esta ação.';
  end if;

  -- 1. Atualizar o papel
  update public.profiles
  set role = p_role,
      updated_at = now()
  where id = p_target_id;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  -- 2. Inserir log de auditoria no mesmo bloco transacional
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

grant execute on function public.admin_update_profile_status(uuid, public.account_status, boolean) to authenticated;
grant execute on function public.admin_update_profile_role(uuid, public.app_role) to authenticated;
