# SDD ledger — plan: docs/superpowers/plans/2026-11-09-processos-navegacao.md

Base: 23fad683979712a628d0874bdb456357dee62f4d.
Execução na branch antigravity/processos-navegacao-20261109 em clone separado.

Pre-flight: frame emite hash; hook normaliza com IDs conhecidos; links React
consomem hash normalizado. Login aceita somente atividade em formato estrito.

Task 1: complete — painel, controles e navegação do frame implementados. Testes primeiro
falharam por ausência de ampliação, expansão que reiniciava o processo e ausência
de mensagem de navegação; passaram após implementação.

Task 2: complete — normalização, links, componente real e middleware testados. O teste do
middleware reproduziu descarte da atividade e escape indevido do ponto de
interrogação no pathname. Corrigidos sem ampliar regras de autorização.

Final review: revisor independente encontrou dois itens relevantes:
- Hidratação tardia perdia o evento de carga do frame.
- Fechar detalhe aberto pelo menu no celular tentava focar um botão oculto.
Ambos foram reproduzidos em novos testes antes das correções. A correção de
hidratação inicia a comunicação após instalar os listeners, apenas quando o
documento da rota do frame já está completo. O retorno do foco escolhe um
elemento visível e não inerte. Sem achados menores adiados.

Ruling: manter Next/React e frame existentes — abordagem escolhida pelo usuário;
uma substituição completa acrescentaria risco de regressão e reimplementação.
Ruling: usar um clone separado sob a pasta de artefatos após bloqueio de escrita
no destino alternativo — preservar o checkout original e seus arquivos locais.

Limites conferidos: testes isolados não comprovam OAuth real, permissões do
ambiente remoto nem publicação. Sem DDL, dados de pacientes ou mudança de acesso.

Validação local: 81 testes Node e 13 cenários Chromium passaram, TypeScript
encerrou com código 0 e audit reportou zero vulnerabilidades. O build Windows
encontrou EPERM ao criar diretórios de saída. Consultar os checks do PR para a
verificação do build em Linux. Os cenários Chromium incluem hidratação tardia,
troca efetiva de página, atualização e histórico, além de links e cliques.
