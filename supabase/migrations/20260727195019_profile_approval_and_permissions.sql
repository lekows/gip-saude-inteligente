-- Aprovação de usuários e permissões administrativas granulares

create type public.account_status as enum ('pendente', 'aprovado', 'suspenso');

create type public.app_permission as enum (
  'gerenciar_usuarios',
  'gerenciar_capacitacoes',
  'registrar_presencas',
  'gerenciar_atividades',
  'validar_evidencias',
  'visualizar_relatorios'
);

alter table public.profiles
  add column account_status public.account_status not null default 'pendente';

create table public.profile_permissions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permission public.app_permission not null,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (profile_id, permission)
);

create index idx_profile_permissions_profile on public.profile_permissions(profile_id);

alter table public.profile_permissions enable row level security;

create or replace function public.has_permission(required_permission public.app_permission)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
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

grant execute on function public.has_permission(public.app_permission) to authenticated;

create or replace function public.can_manage_gip()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
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

create policy profile_permissions_read_self_or_manager
on public.profile_permissions
for select
to authenticated
using (profile_id = auth.uid() or public.can_manage_gip());

create policy profile_permissions_manage
on public.profile_permissions
for all
to authenticated
using (public.can_manage_gip())
with check (public.can_manage_gip());

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.can_manage_gip() then
    if new.role is distinct from old.role
       or new.organization_id is distinct from old.organization_id
       or new.active is distinct from old.active
       or new.account_status is distinct from old.account_status then
      raise exception 'Usuários comuns não podem alterar papel, organização, aprovação ou estado ativo.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  permission_value public.app_permission;
begin
  if current_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if exists (
    select 1
    from public.profiles
    where role = 'administrador'
  ) then
    return false;
  end if;

  update public.profiles
  set role = 'administrador',
      active = true,
      account_status = 'aprovado',
      updated_at = now()
  where id = current_user_id;

  if not found then
    return false;
  end if;

  foreach permission_value in array enum_range(null::public.app_permission)
  loop
    insert into public.profile_permissions (profile_id, permission, granted_by)
    values (current_user_id, permission_value, current_user_id)
    on conflict do nothing;
  end loop;

  return true;
end;
$$;

grant execute on function public.claim_first_admin() to authenticated;

comment on table public.profile_permissions is 'Permissões específicas delegadas a usuários sem necessidade de conceder perfil administrador completo.';
comment on column public.profiles.account_status is 'Controla se o cadastro está pendente, aprovado ou suspenso.';
