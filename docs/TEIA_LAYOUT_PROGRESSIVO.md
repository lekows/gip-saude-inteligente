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
- Busca única; modos Mapa, Lista e Perguntas e informações adicionais em Mais opções.
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

Esta branch é uma proposta em prévia. O ciclo autenticado de revisão visual deve ser conferido antes da integração em produção.
