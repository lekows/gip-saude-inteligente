# Process Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Implementar painel ampliável e navegação contextual autorizados na opção 1.
**Architecture:** Evoluir o frame existente e sincronizar seu estado com a página via mensagens validadas. Utilitário puro compartilha a normalização e construção de links no React.
**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, testes Node e Chromium.
**Spec:** docs/superpowers/specs/2026-11-09-processos-navegacao-design.md

## Global Constraints
Sem dados identificáveis; sem mudanças no banco ou autorização; sem dependências de produção novas; branch exclusiva e PR.

## Review Focus
- Link malformado não injeta destino nem seleciona item desconhecido.
- Mensagem de outra origem/frame não modifica navegação.
- Atualização da URL não recarrega o frame a cada clique.
- Detalhe ampliado não oculta o botão de fechar no celular.
- Troca de modo mantém atividade sem confundir sugestão com assinatura.

### Task 1: Frame e detalhes
Files: lib/processes/graph-template.ts; tests/processGraphBrowser.test.mjs.
Interface: postMessage {type:'gip-process-navigation',hash:string}.
- [ ] Acrescentar testes de painel ampliado, modos visíveis, recolher lista e mensagem de contexto; observar falha.
- [ ] Implementar controles, CSS, foco e estado wide no hash.
- [ ] Executar suíte do frame, incluindo celular, sem exceções.

### Task 2: Contexto da página e links
Files: lib/processes/navigation.ts; components/processes/ProcessReviewWorkspace.tsx; app/unidades/[cnes]/processos/pageContent.tsx; tests/processNavigation.test.mjs; tests/processWorkspaceBrowser.test.mjs.
Interface: normalizeProcessHash(raw,knownIds):string; processHref(cnes,validation,hash):string.
- [ ] Escrever testes de normalização, links, mensagens e persistência; observar falha.
- [ ] Implementar sincronização de contexto, compartilhamento, links dos modos e retorno do login.
- [ ] Testar fluxo do componente real com dados fictícios e dependências externas substituídas somente nos limites.

### Task 3: Integração e entrega
Files: package.json; .github/workflows/validate.yml; docs/TEIA_LAYOUT_PROGRESSIVO.md.
- [ ] Rodar testes existentes, novos testes Chromium, build e npm audit.
- [ ] Revisar diff com revisor independente; corrigir achados relevantes com regressão.
- [ ] Registrar evidências, commit e PR. Sem merge automático.

