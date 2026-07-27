-- Cria perfil automaticamente para novos usuários e protege papéis privilegiados

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuário GIP'
    ),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

-- Impede que um usuário comum altere o próprio papel, organização ou estado ativo.
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
       or new.active is distinct from old.active then
      raise exception 'Usuários comuns não podem alterar papel, organização ou estado ativo.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

-- Permite que apenas o primeiro usuário autenticado assuma a administração inicial.
create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
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
      updated_at = now()
  where id = current_user_id;

  return found;
end;
$$;

grant execute on function public.claim_first_admin() to authenticated;

-- Garante perfil para usuários que eventualmente já existam no Auth.
insert into public.profiles (id, full_name, email)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Usuário GIP'
  ),
  u.email
from auth.users u
on conflict (id) do update
set email = excluded.email,
    updated_at = now();