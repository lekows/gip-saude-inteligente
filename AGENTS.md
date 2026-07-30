# Instrucoes para agentes - GIP Saude Inteligente

Leia primeiro:

1. `docs/HANDOFF_ANTIGRAVITY.md`
2. `docs/PLANO_INICIO_GIP.md`
3. `docs/SPRINT_0_GOVERNANCA_TECNICA.md`
4. `docs/AUTH_ADMIN_BOOTSTRAP.md`

## Limites obrigatorios

- Este repositorio e somente do GIP Saude Inteligente.
- Nao editar, mover, importar ou versionar a pasta local `healthaxys-pro/`.
- Nao usar dados identificaveis de pacientes.
- Tratar todos os arquivos em `data/real/` como seeds demonstrativos enquanto
  nao houver homologacao formal da fonte.
- Mapas publicos mostram apenas agregados territoriais, nunca residencias,
  coordenadas individuais ou trajetos associados a pessoas.
- Nao gravar chaves, tokens, credenciais OAuth ou arquivos `.env` no Git.
- Nao reintroduzir `claim_first_admin` nem qualquer autopromocao administrativa.
- Preservar RLS no Supabase e executar os advisors de seguranca apos mudancas DDL.
- Nao alterar regras de score sem atualizar tipos, documentacao e testes.

## Fluxo de trabalho

- Atualizar `main` antes de iniciar.
- Criar uma branch exclusiva, preferencialmente `antigravity/<tema>`.
- Nao trabalhar na mesma pasta fisica simultaneamente com outro agente.
- Fazer mudancas pequenas, testaveis e compatíveis com os padroes existentes.
- Antes de publicar, executar `npm test`, `npm run build` e `npm audit`.
- Nao usar `git reset --hard`, force push ou reverter alteracoes desconhecidas.
- Abrir PR ou entregar commits pequenos com resumo, testes e riscos residuais.

## Prioridade atual

Concluir a fundacao operacional da Sprint 1:

1. sessao Supabase server-side;
2. protecao de rotas internas;
3. aprovacao de usuarios e gestao de papeis;
4. logout e navegacao por permissao;
5. testes de autenticacao e autorizacao.

Nao iniciar IA preditiva com dados reais antes dessa fundacao e da homologacao
institucional das fontes.
