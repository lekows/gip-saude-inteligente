# Validação dos processos por alunos — primeira entrega

## Como usar

1. Entrar no GIP com uma conta aprovada e ativa.
2. Abrir **Processos** no menu ou no Meu GIP.
3. A coordenação abre a unidade e escolhe **Autorizar participantes**.
4. Buscar as contas pelo nome e autorizar apenas quem participará da rodada.
5. Usar **Copiar link** e compartilhar o endereço pelo canal escolhido. O sistema não envia mensagens automaticamente.
6. O aluno abre a teia, seleciona uma atividade ou pergunta e clica em **Contribuir sobre este item**.
7. Escolher entre etapa compreendida, dúvida, alteração ou etapa/ligação faltante. Alterações exigem uma proposta escrita.
8. A coordenação consulta as contribuições e registra acolhimento para futura revisão, necessidade de esclarecimento ou não acolhimento justificado.

Rota estável após publicação: `/unidades/5882451/processos`.

## O que esta entrega faz

- Mantém a apresentação aprovada em três painéis e os modos Fluxo, Em camadas e Teia.
- Carrega o levantamento de um snapshot protegido no Supabase; o arquivo HTML com os relatos não está em `public/` nem no repositório.
- Registra sugestões com autoria e versão, sem alterar silenciosamente o levantamento.
- Restringe o acesso aos participantes selecionados, além dos gestores autorizados do GIP.
- Permite ao aluno consultar seus próprios textos e devolutivas. Outros alunos não leem essas contribuições.
- Mantém histórico das análises da coordenação e detecta uma análise concorrente.
- Oferece exportação CSV no escopo permitido, revogação de participantes e encerramento/reabertura da rodada.
- Inclui hospitais como camada adicional nos mapas, sem alterar referências ou scores da atenção primária.
- Preserva o destino do link após o login, com uma lista explícita de rotas internas permitidas.

## Limites explícitos

“Etapa compreendida” é uma manifestação acadêmica, não confirmação de que a rotina ocorre no hospital. “Acolhida para próxima revisão” não aplica uma alteração ao mapa. Aprovação institucional, edição de uma nova versão do conteúdo e anexos por equipe pertencem às etapas seguintes do planejamento.

As contas precisam ser aprovadas pelo fluxo já existente. O carregamento inicial não aprova contas, não concede acesso a todos os alunos e não designa validadores institucionais. A tabela de organizações não é usada como substituto de autorização por mapa nesta etapa.

Não inserir dados identificáveis de pacientes. Fontes são apresentadas como referências textuais; os documentos completos permanecem sujeitos à autorização da coordenação.

## Estrutura e segurança

- `process_maps`: snapshot imutável do conteúdo e versão, vinculado à unidade; apenas o estado da rodada pode mudar nesta entrega.
- `process_review_members`: autorização individual, participação e revogação auditadas.
- `process_feedback`: sugestões identificadas e append-only, com nonce para repetição idempotente.
- `process_feedback_reviews`: devolutivas append-only, com revisão esperada e histórico.
- A versão, a etapa, a autoria, a participação, o limite de envios e o estado da rodada são conferidos no banco, inclusive em chamadas diretas à API.
- Cada participante pode enviar até 30 contribuições por hora. Repetir um envio concluído com o mesmo nonce e conteúdo não gera duplicação.
- Mutações e auditoria são feitas na mesma transação. O conteúdo completo é entregue por uma rota autenticada com RLS, CSP e `Cache-Control: private, no-store`.
- A incorporação do grafo em frame do mesmo site preserva a interface e isola a comunicação: o formulário aceita mensagens apenas do frame esperado e da mesma origem. O frame não grava contribuições localmente.

## Migrações e dependência

A migration `20261105012829_process_review` foi gerada/aplicada pelo Supabase após teste em PostgreSQL descartável; o arquivo conserva exatamente o SQL aplicado. O histórico anterior inclui `coordination_hours`, do PR #14. O PR desta entrega é empilhado sobre essa branch, preservando a migration e os commits anteriores sem merge automático em main.

A carga institucional é uma importação administrativa separada da migration de schema. Usa CNES para resolver a unidade, evita duplicação por unidade/versão e não grava o conteúdo no Git. Não reexecutar carga com texto diferente sobre o mesmo número de versão.

## Validação requerida antes de compartilhar

- Testes de regras de entrada e retorno seguro do login.
- Testes PostgreSQL com migrations e RLS reais: convite, conta pendente, leitura privada, autoria, etapa, versão, repetição, limite, revogação, fechamento e histórico de análise.
- Revisão no navegador com CSP, modos do grafo, ponte do formulário e celular.
- `npm test`, `npm run build` e `npm audit`.
- Advisor de segurança após DDL.
- Homologação com duas contas: gestor escolhe participante e copia o link; participante entra, envia sugestão e lê a devolutiva. Esse passo exige contas reais autorizadas e não é substituído por testes SQL com usuários fictícios.

Enquanto o PR não estiver integrado, usar o endereço do deploy de prévia correspondente ao commit validado. O endereço de produção só disponibiliza a funcionalidade após a publicação correspondente.
