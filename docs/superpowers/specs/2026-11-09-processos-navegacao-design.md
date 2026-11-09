# Processos: painel lateral ampliável

## Intenção e decisão
Revisão de 09/11/2026. O usuário escolheu a opção 1 apresentada: manter macroprocessos à esquerda, abrir a atividade ao lado do fluxo e oferecer ampliação para leitura e validação. Alternativa considerada: página própria da atividade; dá espaço, mas rompe a consulta lado a lado. Esta entrega evolui a interface existente.

## Escopo
- Painel lateral de detalhes com Ampliar detalhes / Reduzir detalhes, fechamento e retorno do foco. Em telas pequenas, os detalhes ocupam a área disponível.
- Acesso visível a Fluxo, Atividades, Matrizes e Perguntas. Validação pelas áreas continua na navegação externa com a atividade preservada.
- Separar o botão para abrir um macroprocesso da expansão da lista de atividades.
- URL compartilhável preserva processo, item, visualização, organização, camadas e ampliação. A ponte entre frame e página valida origem, emissor e IDs.
- Trocar teia/validação e retornar do login preserva a atividade. Compartilhar usa o contexto consultado.
- Sugestão acadêmica e aprovação pela área mantêm seus significados distintos.
- Textos e controles legíveis, teclado e foco, mensagem de carregamento/recuperação. Sem alterar dados do levantamento, permissões ou banco.

## Critérios de aceite
Abrir cada macro e atividade; ampliar/reduzir sem perder conteúdo; fechar e reabrir; trocar lista/matriz/fluxo; expandir e recolher a lista sem reiniciar o processo; compartilhar e reabrir; alternar teia/validação; voltar/avançar; navegar em 390 px e com teclado.
O painel preserva os detalhes progressivos existentes. Não há redirecionamento para página nova de atividade.

## Arquitetura e limites
Next/React e frame protegido existentes. Um utilitário puro normaliza somente chaves e IDs conhecidos do estado de navegação. O frame comunica estado por postMessage; a página mantém a URL e os links de modo. Não carregar relatos reais em testes.
Não adicionar dependências de produção, alterar RLS/migrations ou publicar automaticamente em main. Testes usam cenários fictícios. A homologação com usuário real permanece distinta dos testes isolados.

