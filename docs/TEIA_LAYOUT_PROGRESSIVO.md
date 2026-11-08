# Revisão visual da teia de processos

Proposta de 05/11/2026 para revisão por profissionais e alunos sem formação em TI.

## Navegação em três níveis

1. Hospital: uma identidade visual com nome em destaque, símbolo hospitalar ilustrativo e cinco macroprocessos na navegação à esquerda. A abertura mostra a visão geral, sem painel lateral de textos.
2. Processo: selecionar uma área abre seu percurso e revela suas atividades. No celular, a entrada é uma lista legível, com opção de ver o mapa. Há um modo de acompanhamento atividade por atividade.
3. Atividade: o painel abre somente após a seleção. Mostra a descrição atual, a pergunta a esclarecer e ações para registrar entendimento, dúvida ou ajuste. Participantes, registros, transições, dificuldades e fontes ficam em seções expansíveis.

Os textos e relações do snapshot continuam preservados. As ações de opinião encaminham ao formulário autenticado; não validam nem alteram silenciosamente o levantamento.

## Hierarquia visual

- Um único cabeçalho identifica o hospital. O frame não repete seu nome.
- Os macroprocessos permanecem à esquerda; apenas o selecionado expande atividades.
- Busca única; modos Mapa, Lista e Perguntas e informações adicionais em Mais opções. As matrizes completas de atividades e de validação ficam na seção Comparar informações desse menu.
- Administração de participantes e compartilhamento ficam no menu Gerenciar.
- O símbolo é ilustrativo, fornecido pela biblioteca de ícones da aplicação. Não é um logotipo oficial do hospital. Uma marca oficial validada pode substituí-lo posteriormente.
- Estilo claro com tons suaves de verde e azul, maior legibilidade e menos códigos visíveis na navegação principal.

## Comportamento e acesso

O painel de detalhes tem sua própria região de rolagem e fechamento explícito. A adaptação de tela evita sobrepor controles do gráfico aos textos. As seções escondidas visualmente continuam acessíveis por teclado. Escape fecha detalhes e menus; a navegação conserva IDs internamente.

A comunicação entre o frame e o formulário continua restrita à origem e ao frame esperados, com validação do item e do tipo de contribuição. Não foram alterados RLS, perfis, membros, dados ou migrations.

## Roteiro de revisão visual

1. Abrir com gestor e com aluno autorizado; conferir identidade e visão inicial sem textos laterais.
2. Abrir uma área pelo menu e pelo mapa; conferir o mesmo conjunto de atividades.
3. Abrir uma atividade e expandir registros, dificuldades e fontes; verificar rolagem e ausência de sobreposição.
4. Usar Está claro, Tenho uma dúvida e Sugerir ajuste; conferir a atividade e o tipo no formulário antes de enviar.
5. Alternar lista/mapa, modos avançados, pesquisa e passo a passo.
6. Repetir em celular e com teclado, conferindo fechar, Escape e retorno à visão geral.

## Recuperação funcional de 05/11/2026

A transformação inicial do layout excluiu o bloco de eventos entre `walk` e `endDrag`. A sintaxe continuava válida, mas cliques no menu, nós, relações e opções não eram processados. A correção restaura explicitamente esses eventos no template final, sem usar o gerador temporário por substituição entre funções.

Além da navegação principal, foram recuperadas as matrizes completas, com filtros e abertura dos itens; a limpeza da busca atualiza as listas imediatamente. Teia, Camadas e Sequência organizam tanto a visão geral quanto o processo selecionado. Sobre este processo recupera objetivo, descrição, áreas e responsável a confirmar, sem sobrecarregar a abertura. O histórico do frame conserva processo, item, visualização, organização e camadas; voltar e avançar recompõem a tela.

`tests/processGraphBrowser.test.mjs` executa o HTML final em Chromium isolado no GitHub Actions, com a CSP da rota real e apenas dados fictícios. Exercita os cinco processos, 19 atividades, detalhes progressivos, matrizes e filtros, modos e camadas, perguntas, fontes, relações, mensagens de contribuição, teclado, passo a passo, zoom, arraste, histórico e celular. O job de navegação é separado dos testes de domínio e SQL, que também continuam obrigatórios.

O teste de comunicação verifica a mensagem enviada pelo frame. Ele não grava contribuições e não substitui a conferência do envio autenticado pelo formulário com uma conta real. Autenticação, servidor de contribuições, permissões, RLS e conteúdo do levantamento permanecem preservados.

## Validação pelas áreas

O botão **Validação dos processos** abre a lista institucional da unidade, com filtros, resumo para impressão, atividades e histórico. A coordenação indica os representantes entre os participantes ativos com permissão de contribuição. É possível indicar mais de uma área no mesmo processo. A indicação identifica a área e o processo, e cada nova indicação exige nova confirmação dessa área.

A equipe completa a rotina, os responsáveis, os registros, a passagem entre setores e as exceções. Cada representante confere os detalhes vigentes antes de assinar. O verde exige a assinatura de todas as áreas indicadas. Uma correção formal deixa o item vermelho até a próxima revisão dos detalhes. Os demais itens ficam amarelos. Uma revisão reabre os aceites da atividade e das atividades diretamente ligadas nas relações documentadas de sequência ou decisão. Um novo mapa possui seu próprio histórico. As decisões, revisões e reaberturas ficam registradas com autoria e data.

O processo recebe a situação vermelha se alguma atividade exigir ajuste. Com todas as atividades verdes, ele passa a verde. A lista abre o formulário de contribuição no contexto do item e respeita a visibilidade dos textos de cada participante. A área de sugestões continua sendo o local da devolutiva da coordenação. A revisão dos detalhes é uma ação explícita e a teia exibe a descrição revisada.

## Navegação por unidade

O início do GIP destaca Unidades participantes. A seleção usa as unidades ativas que possuem trabalhos acessíveis à conta, consolida as versões de um mesmo mapa e mantém a verificação de acesso no servidor.

A entrada de cada unidade é seu painel. A navegação fixa oferece Painel da unidade, Ações e projetos e Processos. A catarata do Hospital Municipal do Jardim Ingá fica em Ações e projetos, com sua proposta de acompanhamento e demonstração. A teia e a validação são modos internos de Processos. O mapa territorial abre a página da unidade.

Endereços principais:
- /unidades
- /unidades/[cnes]
- /unidades/[cnes]/acoes
- /unidades/[cnes]/acoes/catarata (proposta do Jardim Ingá)
- /unidades/[cnes]/processos
- /unidades/[cnes]/processos/validacao

O catálogo antigo /processos encaminha para /unidades. O painel antigo /unidades/[cnes]/painel encaminha para a entrada da unidade. Os links compartilhados da teia e da validação continuam sendo destinos diretos e retornam corretamente após login.


## Painel executivo visual da unidade — 8 de novembro de 2026

A página da unidade e a demonstração de catarata apresentam cabeçalho executivo,
indicadores coloridos, curva semanal de agenda e execução, composição dos registros
e semáforos por etapa. A identidade do hospital recebe um símbolo decorativo com
profundidade; os gráficos mantêm escalas planas e comparáveis.

O seletor de período e os botões dos dias filtram indicadores, composição,
semáforos, detalhes, pauta e tabela. A curva mantém explicitamente a semana completa
como contexto. Selecionar uma etapa abre suas ocorrências e a ligação para conferir
o processo. A tabela e as informações ainda desconhecidas ficam recolhidas.

O modo reunião amplia a composição e oculta os detalhes de apoio. Sair restaura
os controles. A identificação de demonstração continua visível. A animação do
símbolo e as transições respeitam prefers-reduced-motion. Dados, simulação temporária,
exportação agregada, acesso e RLS permanecem com o comportamento anterior.

Referências de semáforo para o exemplo: verde >=90%, amarelo >=75% e <90%, vermelho
<75%, cinza sem agenda. São realizados/agendados da mesma etapa e período, sem
arredondar antes de classificar. Não representam metas homologadas, qualidade
clínica, score territorial/individual ou validação formal dos processos. Faltas,
adiamentos e registros a esclarecer conciliam com o total agendado. Não há inferência
de pessoas distintas ou cobertura pós-operatória.

Verificação: teste de limites e agenda vazia, reconciliação da composição, cenários
de computador e celular para filtros, detalhamento, modo reunião, movimento reduzido,
simulação e download, além da suíte existente, build e audit. Sem mudança de banco.
