# Plano de início do Programa GIP

Data de referência: 22 de julho de 2026

## 1. Fonte de verdade

O programa seguirá a versão V11 aprovada do projeto de extensão. Os documentos V8, V9 e o parecer anterior permanecem apenas como histórico de revisão.

Período institucional previsto: 1º de agosto de 2026 a 30 de abril de 2028.

## 2. Princípios do produto

- O sistema web será a camada operacional do programa.
- O Power BI continuará sendo uma entrega institucional e receberá dados por exportações ou visões controladas.
- IA será aplicada somente após definição de indicadores, qualidade mínima dos dados e validação humana.
- Nenhum dado real identificável de paciente será usado no ambiente de demonstração.
- Mapas públicos mostrarão apenas dados agregados por território.
- Acesso a informações internas será controlado por perfil e registrado em trilha de auditoria.

## 3. Cronograma do programa

### Agosto a outubro de 2026

- Capacitação da turma piloto de 30 acadêmicos.
- Organização dos 10 acadêmicos colaboradores e docentes.
- Cadastro das equipes, módulos, presença e evidências.
- Preparação dos instrumentos de campo e dicionário de dados.

### Setembro a novembro de 2026

- Diagnóstico inicial nas UBS, CAIS e Secretaria Municipal de Saúde.
- Entrevistas 360 graus, rodas de conversa e levantamento de fluxos.
- Construção da linha de base dos indicadores.
- Saneamento e validação dos dados coletados.

### Fevereiro a abril de 2027

- Matriz de riscos GUT e análise SWOT.
- Desenvolvimento do painel Power BI.
- Implementação de modelos preditivos simples e auditáveis.
- Apresentação de versão preliminar à gestão municipal.

### Março a novembro de 2027

- Oito mutirões preventivos, com pausa em julho.
- Monitoramento de hipertensão, diabetes, condições respiratórias e saúde mental.
- Registro agregado de triagens, encaminhamentos, rodas de conversa e satisfação.

### Setembro a novembro de 2027

- Avaliação periódica, comparação com a linha de base e ajustes estratégicos.

### Fevereiro a abril de 2028

- Relatório técnico final, painel atualizado, devolutiva pública e produção científica.

## 4. Arquitetura recomendada

### Aplicação

- Next.js e TypeScript para portal operacional e aplicativo de campo.
- Tailwind e componentes reutilizáveis para interface.
- Vercel para ambientes de demonstração, homologação e produção.

### Dados

- Supabase separado para banco PostgreSQL, autenticação, armazenamento e auditoria.
- Esquemas distintos para dados de referência, operação, indicadores e evidências.
- Visões agregadas para dashboards e Power BI.
- Políticas de acesso por perfil com Row Level Security.

### Perfis iniciais

- Administrador do programa.
- Professor coordenador.
- Professor colaborador.
- Acadêmico colaborador.
- Acadêmico participante.
- Gestor municipal.
- Consulta pública agregada.

## 5. Módulos do MVP institucional

1. Gestão do programa: ciclos, equipes, unidades, calendário e responsáveis.
2. Capacitação: módulos, turmas, presença, carga horária e evidências.
3. Coleta e qualidade: importação, validação, dicionário e histórico de fontes.
4. Diagnóstico territorial: indicadores agregados, entrevistas e matriz de risco.
5. Ações de campo: planejamento, execução, triagem agregada e encaminhamentos.
6. Evidências: atas, listas, fotos autorizadas, relatórios e registros institucionais.
7. Transparência: indicadores públicos, agenda de ações e QR Code.
8. Integração analítica: exportações e visões para Power BI.

## 6. Sprint 0 - Preparação (22 a 31 de julho de 2026)

- Confirmar a V11 como documento oficial e registrar requisitos rastreáveis.
- Definir responsáveis institucionais e perfis de acesso.
- Criar projeto Supabase exclusivo do GIP.
- Configurar ambientes de desenvolvimento e homologação.
- Definir o dicionário mínimo de dados e regras de qualidade.
- Definir linha de base, indicadores e fontes autorizadas.
- Revisar instrumentos de campo, privacidade, consentimento e necessidade de avaliação ética institucional.
- Corrigir o PoC sintético: formato de CNS e limite do score territorial/individual.

## 7. Sprint 1 - Fundação operacional (1º a 14 de agosto de 2026)

- Autenticação e controle de acesso.
- Cadastro de ciclo, unidades, docentes e acadêmicos.
- Calendário da capacitação e ações de campo.
- Registro de presença e carga horária.
- Catálogo de módulos de capacitação.
- Upload e classificação de evidências.
- Painel inicial de acompanhamento da implantação.

## 8. Critérios de conclusão da primeira entrega

- Usuários entram com perfil autorizado.
- Coordenador cadastra a turma piloto e os colaboradores.
- Agenda de agosto a outubro está publicada.
- Presença e carga horária podem ser registradas e exportadas.
- Evidências ficam vinculadas a atividade, data, local e responsável.
- Dados sintéticos passam pelas regras de qualidade sem erros silenciosos.
- Nenhuma informação identificável aparece em área pública.

## 9. Riscos imediatos

- Misturar dados sintéticos com dados reais sem marcação de origem.
- Publicar coordenadas individuais ou informações identificáveis.
- Usar o score acima de 100 sem regra explícita de normalização.
- Importar campos booleanos como datas, como ocorreu com `cns_valido`.
- Prometer IA antes de existir linha de base confiável.
- Desenvolver dentro de pastas sincronizadas e sofrer corrupção de artefatos de build.
- Substituir o Power BI prometido no projeto sem aprovação institucional.

## 10. Próxima decisão

Começar pela Sprint 0 e usar o sistema existente como protótipo visual. A primeira refatoração de produção deve priorizar autenticação, Supabase, governança e capacitação; os módulos avançados de IA e mutirão entram conforme o cronograma aprovado.
