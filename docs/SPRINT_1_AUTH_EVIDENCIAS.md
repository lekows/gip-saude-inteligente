# Sprint 1 - Evidencias de autenticacao e autorizacao

Data da verificacao: 10 de agosto de 2026.

## Resultado

A fundacao de autenticacao e autorizacao esta funcional no ambiente hospedado.
O perfil continua sendo a fonte de autorizacao. O dispositivo e usado somente
para escolher a experiencia inicial: `/mobile` em celular ou tablet e
`/manager-dashboard` em computador. Links internos explicitos preservam o
destino solicitado.

## Evidencias concluidas

| Controle | Evidencia | Resultado |
| --- | --- | --- |
| Sessao server-side | `@supabase/ssr`, callback PKCE e middleware | Concluido |
| Rotas internas | Middleware valida sessao, aprovacao e atividade | Concluido |
| Conta pendente ou suspensa | Redirecionamento para `/aguardando-aprovacao` | Concluido |
| Administracao | `/admin/usuarios` com aprovacao, suspensao e papeis | Concluido |
| Auditoria | RPC atualiza perfil e `audit_logs` na mesma transacao | Concluido |
| Protecao administrativa | Autossuspensao e remocao do ultimo admin no banco | Concluido |
| Rota legada | `/gerenciar-usuarios` redireciona ao painel seguro | Concluido |
| Entrada responsiva | Celular abre `/mobile`; computador abre dashboard | Implementado nesta branch |
| Privacidade da triagem | Nome e local individual removidos; RLS restrita | Implementado nesta branch |
| Qualidade tecnica | 18 testes e build Next.js aprovados | Concluido |
| Dependencias | `npm audit` sem vulnerabilidades | Concluido |

## Evidencias de banco

- Migrations hospedadas ate
  `20260810224727_secure_admin_rpcs_and_clinical_privacy`.
- RPCs administrativas executam como `security invoker`.
- Papel `anon` nao possui permissao de execucao nas RPCs administrativas.
- Tabelas `patients` e `clinical_screenings` nao possuem politicas publicas.
- Triagens sao visiveis pelo autor aprovado ou por gestor autorizado.
- Advisor de seguranca sem alertas de RLS ou funcoes privilegiadas. Permanece
  apenas a configuracao opcional de protecao contra senhas vazadas no painel de
  Auth.

## Pendencias para encerramento formal

1. Revisar e aprovar o Pull Request desta branch.
2. Confirmar o deploy da Vercel.
3. Testar login em um celular e em um computador.
4. Ativar a protecao de senhas vazadas no Supabase, caso o plano contratado
   disponibilize o recurso.

Depois dessas quatro verificacoes, o WP de autenticacao e autorizacao pode ser
marcado como finalizado. Os CRUDs de ciclos, equipes, capacitacoes, presencas e
evidencias pertencem ao proximo pacote de trabalho.
