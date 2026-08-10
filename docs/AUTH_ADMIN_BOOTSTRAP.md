# Primeiro administrador

O GIP não promove automaticamente o primeiro usuário autenticado. Isso evita que
uma pessoa externa se torne administradora apenas por acessar o login antes da
equipe responsável.

## Procedimento inicial

1. O administrador deve entrar uma vez em `/entrar`.
2. A conta será criada com status `pendente`.
3. No SQL Editor do projeto `gip-saude-inteligente` no Supabase, substitua o
   e-mail no comando abaixo e execute-o com uma conta autorizada:

```sql
begin;

-- A guarda aceita campos privilegiados somente nesta transacao controlada.
select set_config('app.admin_profile_write', 'on', true);

with approved_admin as (
  update public.profiles
  set role = 'administrador',
      account_status = 'aprovado',
      active = true,
      updated_at = now()
  where email = 'EMAIL_DO_ADMINISTRADOR'
  returning id
)
insert into public.profile_permissions (profile_id, permission, granted_by)
select
  approved_admin.id,
  permissions.permission_value,
  approved_admin.id
from approved_admin
cross join unnest(enum_range(null::public.app_permission))
  as permissions(permission_value)
on conflict do nothing;

insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
select
  id,
  'bootstrap_first_admin',
  'profile',
  id::text,
  jsonb_build_object('role', 'administrador', 'account_status', 'aprovado')
from public.profiles
where email = 'EMAIL_DO_ADMINISTRADOR';

commit;
```

O comando não cria usuários e não funciona antes do primeiro login. Depois do
bootstrap, novas contas devem ser aprovadas pelo fluxo administrativo do GIP.
O bootstrap e uma excecao institucional unica e fica registrado em
`audit_logs`. Nao reutilize esse procedimento para aprovar contas comuns.
