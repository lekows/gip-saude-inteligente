# Instruções para Aprovar lekows como Administrador

## Como executar o script SQL

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard/project/qkevrhbxysijtlrkianb
2. No menu lateral, clique em **SQL Editor**
3. Clique em **+ New query**
4. Cole o conteúdo do arquivo `aprovar-lekows-admin.sql`
5. Clique em **Run** (ou Ctrl+Enter)
6. Verifique os resultados das 4 queries

## O que o script faz

- **Query 1**: Verifica se você (`lekows@gmail.com`) existe em `auth.users` (tabela de autenticação)
- **Query 2**: Verifica se seu perfil já existe em `public.profiles`
- **Query 3**: Cria ou atualiza seu perfil com:
  - `role = 'administrador'`
  - `account_status = 'aprovado'`
  - `active = true`
- **Query 4**: Confirma que tudo foi aplicado corretamente

## Depois de executar

1. Acesse: https://gip-saude-inteligente.vercel.app/entrar
2. Faça login com Google
3. Você será redirecionado para `/manager-dashboard` (não mais `/aguardando-aprovacao`)
4. No dashboard, clique em **"Gerenciar usuários"** para aprovar outros alunos
