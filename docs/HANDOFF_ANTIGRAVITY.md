# Handoff para Antigravity - GIP Saude Inteligente

Atualizado em 30 de julho de 2026.

## 1. Missao do produto

O GIP Saude Inteligente e um MVP de inteligencia territorial em saude publica
para Luziania-GO, usando o codigo municipal IBGE `5212501` como referencia.

O sistema demonstra:

- gestao do programa e metas municipais;
- risco territorial agregado por bairro;
- priorizacao de UBS, CAIS e mutiroes;
- planejamento, execucao e relatorio de acoes preventivas;
- busca ativa mobile;
- governanca, importacao e qualidade de dados SUS;
- futura integracao com Power BI.

O sistema nao e prontuario e nao deve armazenar ou exibir dados identificaveis
de pacientes no MVP.

## 2. Repositorio e ambientes

- GitHub: `https://github.com/lekows/gip-saude-inteligente`
- Branch de producao: `main`
- Commit de referencia deste handoff: `87736f2`
- Producao: `https://gip-saude-inteligente.vercel.app`
- Supabase: projeto `gip-saude-inteligente`
- Project ref Supabase: `qkevrhbxysijtlrkianb`
- Regiao Supabase: `sa-east-1`

O projeto `healthaxys-pro` e completamente separado. Nao ha compartilhamento de
codigo, banco, Vercel, Supabase ou requisitos entre os dois projetos.

## 3. Stack

- Next.js `15.5.21`, App Router
- React `19`
- TypeScript
- Tailwind CSS
- componentes locais inspirados em shadcn/ui
- React Leaflet e Leaflet
- Recharts
- Lucide React
- Supabase Auth, PostgreSQL, Storage e RLS
- Vercel

Comandos obrigatorios:

```bash
npm install
npm test
npm run build
npm audit
```

O lockfile deve permanecer versionado.

## 4. Variaveis de ambiente

Nomes esperados:

```dotenv
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_SUPABASE_AUTH_AZURE_ENABLED=false
NEXT_PUBLIC_SUPABASE_AUTH_FACEBOOK_ENABLED=false
```

Nunca copie valores reais para documentacao, commits, logs ou mensagens.

Em producao:

- login por e-mail esta habilitado;
- Google OAuth esta habilitado;
- Azure/Microsoft fica oculto e desabilitado;
- Facebook fica oculto na aplicacao;
- Site URL do Supabase aponta para o dominio de producao;
- `/auth/callback` esta na lista de redirects permitidos.

## 5. Estado funcional

Rotas existentes:

| Rota | Funcao |
| --- | --- |
| `/` | central operacional |
| `/entrar` | Google OAuth e magic link |
| `/auth/callback` | validacao do usuario e perfil |
| `/aguardando-aprovacao` | conta pendente |
| `/manager-dashboard` | KPIs e mapa do gestor |
| `/territorial-map` | mapa territorial |
| `/campaign-planner` | sugestao simulada de mutirao |
| `/campaign-execution` | execucao da campanha |
| `/campaign-report` | relatorio da campanha |
| `/municipal-report` | consolidado municipal |
| `/municipal-goals` | metas municipais |
| `/mobile` | Busca Ativa GIP |
| `/comunidade` | pagina publica |
| `/data` | hub de dados |
| `/data-import` | importacao e validacao |
| `/data-quality` | qualidade e graficos |
| `/data-dictionary` | dicionario e catalogo de fontes |

Os modulos visuais usam principalmente dados mockados. O Supabase ja possui
schema inicial para organizacoes, unidades, perfis, ciclos, membros,
capacitacoes, presencas, atividades, evidencias, permissoes e auditoria, mas a
maior parte das telas ainda nao realiza CRUD real nessas tabelas.

## 6. Dados e privacidade

Arquivos em `data/real/`:

- `health_units_cnes.csv`
- `aps_indicators_sisab.csv`
- `outpatient_production_sia.csv`
- `hospital_morbidity_sih.csv`
- `mortality_sim.csv`
- `notifiable_diseases_sinan.csv`
- `nutritional_status_sisvan.csv`
- `immunization_pni.csv`
- `luziania_neighborhoods.geojson`

Apesar do nome da pasta, esses arquivos sao seeds de demonstracao e ainda nao
equivalem a extracoes oficiais homologadas. O SIM e explicitamente simulado.

Atualizacao de 12 de agosto de 2026: `health_units_cnes.csv` foi substituido
por um recorte oficial e minimizado do CNES. Tambem foram adicionados
`aps_indicators_sisab_official.csv`, `luziania_municipality_ibge.geojson` e
`source_provenance.json`. O arquivo territorial `aps_indicators_sisab.csv` e a
malha `luziania_neighborhoods.geojson` permanecem demonstrativos e aguardam
homologacao municipal. Consulte `docs/DADOS_OFICIAIS_CNES_IBGE_SISAB.md`.

Atualizacao de 14 de agosto de 2026: a malha oficial foi ampliada para 348
setores censitarios com demografia e caracteristicas domiciliares agregadas do
Censo 2022. O arquivo `census_sector_vulnerability_ibge.csv` preserva o recorte
auditavel, e o dashboard alterna entre pressao de cobertura e contexto de
vulnerabilidade. Dos 348 setores, 317 possuem score demonstrativo; 31 ficam sem
score por insuficiencia estatistica. Valores `X` do IBGE nunca sao estimados.

Regras permanentes:

- nenhum nome, CPF, CNS real, telefone ou endereco residencial;
- nenhum ponto domiciliar individual em mapas;
- pacientes somente agregados por bairro, unidade, campanha ou microarea
  autorizada;
- fonte, periodo, municipio e natureza simulada devem ser rastreaveis;
- dados reais do SUS so entram apos autorizacao, dicionario aprovado, minimizacao
  e avaliacao de privacidade/etica;
- nunca misturar silenciosamente dados reais e simulados.

## 7. Scores

Score individual:

- PA alterada: ate 25;
- glicemia alterada: ate 20;
- IMC/obesidade: ate 10;
- doencas cronicas: ate 15;
- baixa adesao: ate 10;
- retorno precoce: ate 10;
- vulnerabilidade/idade: ate 10;
- total limitado a 100.

Classificacao individual:

- 0 a 29: verde;
- 30 a 59: amarelo;
- 60 a 100: vermelho.

Score territorial:

- cobertura baixa: 20;
- percentual de alto risco: 25;
- faltantes agregados: 15;
- retornos precoces: 10;
- tempo de espera: 10;
- carga HAS/DM: 10;
- entrevistas 360: 10;
- total limitado a 100.

Classificacao territorial institucional:

- 0 a 34: verde;
- 35 a 69: amarelo;
- 70 a 100: vermelho.

Alguns componentes demonstrativos usam quatro niveis visuais
(`baixo`, `medio`, `alto`, `critico`). Nao unifique ou altere essas faixas sem
primeiro definir uma unica regra de produto e atualizar testes e documentacao.

## 8. Seguranca ja implementada

Atualizacao de 10 de agosto de 2026: a fundacao SSR da Sprint 1 foi implementada.
Consulte `docs/SPRINT_1_AUTH_EVIDENCIAS.md` para a matriz de aceite e os passos
restantes de encerramento formal.

- RLS habilitado nas tabelas expostas.
- Usuarios pendentes nao leem tabelas internas.
- Funcoes `security definer` sensiveis foram removidas da API publica ou
  restringidas.
- `claim_first_admin` foi removida.
- Arquivos do bucket `gip-evidencias` sao limitados ao dono ou gestor.
- Logs de auditoria exigem `actor_id = auth.uid()`.
- Alteracoes administrativas usam RPCs atomicas `security invoker`.
- Colunas privilegiadas de perfil nao aceitam `PATCH` direto.
- Triagens nao coletam nome nem coordenada residencial individual.
- Callback usa `supabase.auth.getUser()`, nao confia apenas na sessao local.
- Callback consulta `account_status`.
- Provedores OAuth so aparecem com flag explicita.
- Ultima auditoria registrada: zero alertas de RLS ou funcoes privilegiadas e
  zero vulnerabilidades npm. O painel Auth ainda recomenda ativar a protecao
  opcional contra senhas vazadas.

Migracoes:

```text
20260727193434_initial_gip_schema.sql
20260727193707_auth_profile_bootstrap.sql
20260727195019_profile_approval_and_permissions.sql
20260729023741_harden_auth_rls.sql
20260729024332_optimize_foreign_key_indexes.sql
20260804225844_create_patients_and_screenings.sql
20260810171657_admin_update_profile_atomic.sql
20260810185741_harden_profile_admin_columns_guard.sql
20260810224727_secure_admin_rpcs_and_clinical_privacy.sql
```

Nao editar migracoes ja aplicadas. Criar uma nova migracao para qualquer mudanca.

## 9. Estado atual

A autenticacao server-side, a protecao de rotas, o logout, a aprovacao de contas
e a auditoria administrativa estao implementados. O fechamento formal depende
do PR, do deploy e do teste final em celular e computador descritos em
`docs/SPRINT_1_AUTH_EVIDENCIAS.md`.

O dispositivo escolhe somente a tela inicial. Aprovacao, papel e permissoes
continuam definindo quais operacoes o usuario pode executar.

## 10. Proxima entrega recomendada

### Objetivo

Iniciar os cadastros operacionais da Sprint 1 sem ampliar o uso de dados reais.

### Escopo

1. CRUD de ciclos, equipes, unidades e vinculos de participantes.
2. Calendario de capacitacoes e atividades de campo.
3. Registro de presenca e carga horaria.
4. Catalogo de modulos de capacitacao.
5. Upload de evidencias com metadados, autorizacao e auditoria.
6. Exportacao institucional agregada.

### Rotas publicas minimas

- `/entrar`
- `/auth/callback`
- `/aguardando-aprovacao`
- `/comunidade`

A decisao sobre `/` deve ser explicita: transformar em pagina publica resumida
ou exigir sessao e mover a entrada institucional para outra rota.

### Criterios de aceite

- usuario sem sessao nao abre rota interna;
- usuario pendente vai para `/aguardando-aprovacao`;
- usuario suspenso nao acessa o sistema;
- usuario aprovado acessa somente o permitido;
- administrador aprova contas sem usar SQL no fluxo normal;
- logout encerra a sessao;
- refresh preserva sessao valida;
- OAuth Google retorna ao dominio correto;
- nenhuma service role aparece no cliente;
- testes e build passam;
- advisors de seguranca do Supabase nao apresentam novos alertas.

## 11. Sequencia posterior

Depois da autenticacao:

1. CRUD de ciclos, equipes, unidades e perfis.
2. Modulo de capacitacao: turmas, modulos, presenca e carga horaria.
3. Upload de evidencias com metadados e autorizacao.
4. Calendario das atividades de agosto a outubro de 2026.
5. Exportacao agregada para Power BI.
6. Homologacao do dicionario e das fontes.
7. Pipeline controlado de CNES + SISAB + IBGE.
8. Somente depois, modelos preditivos simples, auditaveis e com validacao humana.

## 12. Regras de colaboracao

- Trabalhar em clone ou worktree separado.
- Criar branch `antigravity/<tema>`.
- Nao editar diretamente `main`.
- Fazer pull antes de iniciar.
- Nao sobrescrever mudancas de outros agentes.
- Nao tocar em `healthaxys-pro/`.
- Commits pequenos e descritivos.
- Entregar PR com resumo, testes e riscos.
- Nao fazer force push.
- Nao publicar automaticamente dados ou arquivos locais.

## 13. Prompt pronto para iniciar no Antigravity

```text
Voce vai continuar o projeto GIP Saude Inteligente.

Repositorio:
https://github.com/lekows/gip-saude-inteligente

Antes de alterar codigo:
1. clone ou atualize o repositorio;
2. leia AGENTS.md;
3. leia docs/HANDOFF_ANTIGRAVITY.md;
4. confirme que esta no repositorio GIP e nao em healthaxys-pro;
5. crie a branch antigravity/auth-foundation.

Sua primeira missao e concluir a fundacao de autenticacao e autorizacao da
Sprint 1. Implemente sessao Supabase server-side para Next.js 15, protecao de
rotas internas, tratamento de contas pendentes/suspensas, logout, navegacao por
permissao e uma pagina administrativa para aprovar usuarios e atribuir papeis.

Preserve as migracoes e politicas RLS existentes. Nunca use service role no
cliente. Nunca reintroduza claim_first_admin. Nao use dados reais identificaveis
de pacientes. Nao altere healthaxys-pro.

Comece auditando o codigo atual e a documentacao. Depois apresente um plano curto
e implemente em etapas pequenas. Para mudancas no banco, crie nova migracao e
execute os advisors de seguranca do Supabase. Antes de entregar, rode npm test,
npm run build e npm audit. Abra um PR com resumo, testes, migracoes e riscos
residuais. Nao faça force push nem merge automatico em main.
```

## 14. Definicao de pronto para o handoff

O Antigravity deve responder inicialmente com:

- branch criada;
- arquivos lidos;
- diagnostico da autenticacao atual;
- lista de rotas publicas e protegidas proposta;
- plano de implementacao;
- riscos ou dados externos realmente necessarios.

Se ele pedir chaves Supabase, Google ou Vercel no chat, nao envie. Configure os
segredos diretamente nos paineis apropriados.
