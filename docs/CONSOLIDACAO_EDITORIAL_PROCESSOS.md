# Consolidação editorial dos processos

A consolidação assistida incorpora esclarecimentos sustentados nas contribuições sem assinar em nome da coordenação ou das áreas. O levantamento original, os comentários e as respostas humanas permanecem preservados.

## Leitura e precedência

1. Snapshot da rodada.
2. Última decisão editorial aplicável à atividade e à versão.
3. Detalhes efetivamente registrados pela área.

A consolidação não gera eventos de aprovação nem altera os critérios dos semáforos. Uma decisão com necessidade de esclarecimento mantém o texto original e destaca a pergunta. Sugestões de controle continuam identificadas como propostas.

O texto editorial é limitado à data da última revisão humana da atividade. O diagrama é limitado à primeira revisão humana do macroprocesso, para preservar o percurso que a equipe pôde conferir. Uma decisão posterior de esclarecimento retira a consolidação anterior quando ainda não houve revisão humana.

Ao revisar uma atividade pela área, o banco reabre as passagens relacionadas tanto no snapshot quanto nos diagramas editoriais da mesma versão. O conjunto histórico é conservador: pode exigir nova conferência de uma ligação antiga, mas evita manter uma aprovação cuja passagem mudou.

## Histórico e acesso

`process_editorial_revisions` é append-only e acessível somente a contas autorizadas para o mapa. A autoria vem da contribuição original. O responsável técnico é identificado como consolidação assistida; nenhuma identidade humana é simulada.

A importação administrativa deve conferir mapa, versão, atividade, autor e conteúdo da fonte antes de inserir. Cada lote usa referência estável e unicidade por contribuição para impedir duplicação. Correções geram novas linhas. O banco valida o vínculo da fonte e audita a operação.

O código público contém somente implementação e testes sintéticos. As descrições e decisões reais permanecem no banco protegido.

## Diagrama e navegação

O botão **Ver decisões** expõe os caminhos condicionais. As passagens mostram seu significado; detalhes apresentam autoria, esclarecimentos, perguntas e ideias separadamente. Matrizes e validação recebem o mesmo texto consolidado.

Diagramas incompletos ou com nós de outro processo são rejeitados na leitura, preservando o desenho original. Cada nó precisa de posição finita; cada ligação precisa de identificador e metadados. Quando só há desenho básico, a visualização de decisões utiliza esse mesmo desenho.

## Verificação

Os testes exercitam a precedência de fontes, congelamento após revisão humana, retirada de consolidação, diagramas inválidos, RLS, acesso revogado, histórico imutável, reabertura de passagens e navegação real em Chromium. As migrations não modificam comentários nem criam assinaturas.
