# Plano de implementação — processos das unidades de saúde

## Objetivo e entrega deste PR

Integrar ao GIP uma teia de processos por unidade de saúde, acessível pelo mapa da rede e pelo menu Processos, com colaboração autorizada, rastreabilidade e validação institucional.

O PR começou com este planejamento. A primeira entrega implementa leitura protegida da teia, convite individual de contas aprovadas, contribuições identificadas por etapa e análise com histórico. Consulte TEIA_VALIDACAO_ALUNOS.md para o uso e os limites. Edição do conteúdo de uma nova versão, anexos por equipe e aprovação institucional continuam como etapas posteriores.

## Experiência pretendida

1. Localizar hospital, UBS ou CAIS no mapa.
2. Abrir a página da unidade e seus processos.
3. Percorrer a teia em Fluxo, Em camadas ou Teia; consultar a matriz e as perguntas.
4. Complementar atividades, relações, sistemas, responsáveis e fontes conforme a autorização.
5. Conferir contribuições por setor e aprovar uma versão institucional.
6. Consultar o histórico e preservar a versão aprovada durante novas revisões.

Rota proposta: `/unidades/[cnes]/processos`. A lista `/processos` oferece uma alternativa ao mapa. O piloto utilizará o Hospital Municipal do Jardim Ingá, CNES `5882451`. Identificadores CNES permanecem texto, preservando zeros iniciais.

Unidades sem levantamento exibem estado vazio explícito. Unidades sem CNES exigem identificação interna estável e conferência cadastral; não recebem códigos inventados nem associações automáticas por nome.

## Diagnóstico técnico e dependências

- A aplicação possui sessão server-side, aprovação de contas, rotas protegidas e gestão administrativa. Essas funções serão reutilizadas e testadas no novo módulo.
- Os mapas analisados recebem unidades pelo adaptador `lib/dataLoaders/susAdapters.ts`, cujo recorte atual seleciona UBS e CAIS.
- O catálogo de arquivos contém hospitais. O banco operacional e os arquivos do mapa precisam de uma conciliação explícita.
- A tabela `health_units` possui UUID e CNES; os processos devem referenciar o UUID, com resolução do CNES na navegação.
- Ainda não existe estrutura específica de processos. A tabela `activities` atende à operação acadêmica do programa e não será reutilizada como cadastro de atividades dos fluxos hospitalares.
- As permissões globais atuais não substituem autorização por unidade, setor e processo.
- O armazenamento existente é privado, com regras de autor/gestor; colaboração por equipe requer políticas próprias.
- A migration `20260924124323_coordination_hours` já aplicada está documentada na branch do PR #14, mas ainda não está na base deste PR. Conciliar o histórico por revisão do PR #14 ou outra integração explícita antes de aplicar novas migrations. Não reaplicar, renomear ou alterar a migration existente.

O trabalho começa em `antigravity/teia-processos-unidades`, criada a partir da main atual. A conciliação com #14 não autoriza merge automático nem inclusão de alterações desconhecidas.

## Escopo funcional

### Navegação e mapa

- Exibir hospitais, UBS e CAIS com legenda e filtros adequados.
- Oferecer acesso aos processos no marcador e no painel da unidade, acessível também por teclado e celular.
- Preservar filtros, retorno ao mapa e identificação da unidade.
- Separar a camada de estabelecimentos dos cálculos de cobertura APS; incluir hospitais no mapa não os transforma em referências de atenção primária.
- Não alterar pesos, faixas, regras de score, fontes territoriais ou estimativas existentes.

### Teia e edição

- Preservar os três painéis e os elementos visuais do protótipo revisado: lista, grafo, detalhes, cores, ícones, filtros, matriz e pontos de validação.
- Armazenar atividades e relações como conteúdo editável, sem manter a topologia exclusivamente fixa em JavaScript.
- Permitir criar e revisar macroprocessos, subprocessos, atividades, decisões, entradas, saídas e interfaces.
- Relacionar áreas, funções responsáveis, sistemas, fontes, perguntas, riscos potenciais e propostas.
- Separar entendimento relatado, conferência do setor, risco inferido e melhoria proposta.
- Tratar posição visual dos nós separadamente do significado da relação. Arrastar um nó não altera sequência ou regra operacional.
- Suportar ligações entre setores e unidades com escopo explícito; acesso a uma unidade não concede acesso ao conteúdo restrito de outra.

### Colaboração e validação

| Participação no módulo | Permissão pretendida |
| --- | --- |
| Leitor | Consultar o conteúdo disponibilizado dentro do seu escopo. |
| Colaborador | Complementar rascunhos e registrar comentários nos setores/processos atribuídos. |
| Responsável pelo processo | Conferir contribuições e validar o entendimento do setor atribuído. |
| Coordenação GIP | Organizar o levantamento, revisar contribuições e preparar versões dentro do escopo concedido. |
| Diretor ou delegado | Aprovar a versão institucional e registrar a validação sob delegação autorizada. |
| Administrador | Aprovar contas e administrar vínculos e permissões; não se confunde com aprovação institucional de conteúdo. |

Essas participações são vínculos do módulo. Não conceder papel global administrador ao diretor ou aos profissionais como condição para colaborar. Delegações devem ter escopo, autoria e histórico; a criação ou ampliação de acessos permanece restrita à administração autorizada.

Fluxo proposto: **rascunho → em validação → conferido pelo setor → aprovado institucionalmente**.

- A aprovação deve referenciar uma versão exata, com ator, data e escopo.
- Novas alterações geram revisão, sem sobrescrever a versão aprovada.
- Responder pergunta não aprova automaticamente atividade, processo ou unidade.
- Salvar exige versão esperada; conflito de edição retorna os dados atuais para revisão, em vez de sobrescrever silenciosamente.
- Arquivamento preserva referências e histórico; excluir visualmente não deve apagar a rastreabilidade.
- O modo apresentação mostra a versão e a situação do levantamento. Publicação institucional é interna por padrão, sem disponibilização pública automática.

## Modelo de dados proposto

Nomes finais serão definidos após a revisão do schema. As responsabilidades mínimas são:

| Conjunto | Responsabilidade |
| --- | --- |
| Unidades existentes e vínculos de membros | Resolver unidade/CNES e delimitar leitura, edição, revisão e aprovação. |
| Processos e atividades | Macroprocesso, subprocesso, atividade, área, responsável e situação. |
| Relações | Origem, destino, significado, condição, natureza relatada/proposta e fonte. |
| Catálogo de sistemas e fontes | Referências e limites da informação; uso citado não comprova integração técnica. |
| Perguntas e contribuições | Respostas, comentários, propostas e pendências vinculadas ao item. |
| Revisões e aprovações | Versões preservadas, versão de trabalho e manifestação sobre versão exata. |
| Anexos restritos | Metadados e objetos acessíveis apenas dentro do escopo autorizado. |
| Auditoria | Alteração registrada com autoria obtida da sessão e conteúdo anterior/posterior. |

Mutações relevantes, revisão e auditoria devem ser atômicas no banco. Evitar histórico dependente apenas de eventos enviados pelo navegador. Autorizações não podem depender de `user_metadata` editável pelo usuário.

## Segurança e tratamento dos dados

- Reutilizar a autenticação existente e verificar aprovação, atividade da conta e vínculo ao escopo no servidor e no banco.
- RLS habilitada em todas as tabelas expostas, com leitura e escrita compatíveis e proteção contra alteração indevida da unidade, autoria e status de aprovação.
- Acesso autenticado por si só não concede leitura de todos os processos.
- Não usar service role no cliente nem reintroduzir `claim_first_admin`.
- Views e funções devem preservar o modelo de autorização. Preferir `security invoker`; exceções de privilégio exigem justificativa, schema privado e grants mínimos.
- Documentos de processo devem ter políticas próprias de equipe/unidade. Não tornar público o bucket existente para facilitar compartilhamento.
- O repositório é público: incluir apenas código, estrutura e exemplos fictícios. Relatos internos, respostas da reunião e anexos institucionais não devem ser embarcados como HTML público, JSON estático, fixture ou seed versionado.
- Migrar o conteúdo do protótipo para o banco protegido por procedimento autorizado e idempotente, preservando identificadores de origem e situação de validação.
- Usar apenas informações de processos. Não inserir dados identificáveis de pacientes.
- Arquivos em `data/real/` conservam os limites de homologação definidos em AGENTS.md.
- Não estabelecer conectividade com SISREG, CELK ou sistemas estaduais nesta etapa; nomes, bases e permissões locais ainda dependem de validação.
- O aviso existente de proteção contra senhas comprometidas será acompanhado separadamente, conforme disponibilidade do plano. Não abrir políticas das tabelas de avaliações por causa de alertas informativos esperados.

## Sequência de implementação

| Etapa | Entrega | Aceite |
| --- | --- | --- |
| 0 — Base e histórico | Conciliar main, PR #14 e migrations aplicadas; revisar autenticação e schema. | Correspondência rastreável, sem reaplicar DDL ou sobrescrever trabalho existente. |
| 1 — Unidade e mapa | Resolver CNES/UUID; página da unidade; hospitais e acesso pelo mapa/menu. | Jardim Ingá abre a unidade correta; demais unidades têm estado vazio; scores APS preservados. |
| 2 — Persistência e leitura | Tabelas e políticas do módulo; leitura da teia protegida; matriz e perguntas. | Duas sessões autorizadas consultam a mesma versão e acessos fora do escopo são negados. |
| 3 — Colaboração | Edição de conteúdo/relações, comentários, fontes, anexos e histórico. | Contribuição persistida com autoria, escopo e conflito detectado. |
| 4 — Validação e apresentação | Conferência por setor, versão institucional, delegação autorizada e modo apresentação. | Aprovação ligada à versão exata e histórico preservado após revisão. |
| 5 — Piloto | Levantamento inicial no Jardim Ingá e uso com setores indicados. | Percurso de marcação cirúrgica discutido com cadastro e comunicação; pendências registradas sem prometer resultados não medidos. |

A carga inicial proposta é a organização já revisada no protótipo: cinco macroprocessos, 19 atividades e 12 perguntas. A revisão visual pelo solicitante não equivale à aprovação institucional dos relatos. Nomes e funções dos responsáveis operacionais devem ser confirmados pelos setores.

Não criar usuários, aprovar contas pendentes ou atribuir permissões automaticamente durante a carga.

## Critérios de validação

- [ ] Usuário sem sessão, pendente, suspenso ou sem vínculo não acessa conteúdo restrito.
- [ ] Leitor não escreve; colaborador não aprova nem amplia seu escopo.
- [ ] Alterar diretamente IDs da unidade, processo ou objeto não contorna a autorização.
- [ ] Atribuir, remover ou suspender acesso produz o efeito esperado nas operações seguintes.
- [ ] Login e retorno à unidade solicitada funcionam no computador e no celular.
- [ ] Hospital/UBS no mapa resolve o CNES correto, inclusive com zeros iniciais.
- [ ] Unidade desconhecida e unidade sem levantamento têm tratamento explícito.
- [ ] Hospitais aparecem na camada de rede sem alterar cálculo ou referência APS.
- [ ] Todas as atividades e perguntas da carga autorizada conservam vínculo e proveniência.
- [ ] Edição de texto, criação de etapa e alteração de relação persistem entre sessões.
- [ ] Dois colaboradores editando a mesma versão recebem tratamento de conflito.
- [ ] Auditoria acompanha a mutação e não pode ser reescrita por colaborador.
- [ ] Responder pergunta não aprova automaticamente o conteúdo.
- [ ] Aprovação vincula versão exata; revisão posterior preserva a anterior.
- [ ] Documento restrito não é acessível por URL pública ou por outra unidade sem autorização.
- [ ] Conteúdo inserido em formulários não executa HTML/scripts; exportações preservam o escopo.
- [ ] Migrations são verificadas em ambiente de teste antes da aplicação hospedada.
- [ ] Executar `npm test`, `npm run build` e `npm audit` antes de publicação.
- [ ] Executar advisors de segurança após DDL e analisar qualquer novo alerta.
- [ ] Demonstração funcional: mapa → hospital → teia → contribuição → conferência em outra sessão → histórico.

## Riscos e limites

As contas existentes não indicam autorização para o novo módulo. Os vínculos por unidade e os validadores institucionais ainda precisam ser cadastrados por ação autorizada. Unidades sem CNES não serão deduplicadas automaticamente. O conteúdo local dos sistemas citados e suas integrações permanece a confirmar. O módulo descreve processos; não é prontuário nem fila operacional de pacientes.

As implementações e seus testes serão registrados nos próximos commits e na descrição atualizada do PR. Não confundir testes da base do repositório com aceitação das funcionalidades ainda propostas.

