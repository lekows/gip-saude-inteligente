# Consolidação editorial e diagrama de processos

> Execução nesta sessão; contribuições reais permanecem exclusivamente no banco protegido.

**Objetivo:** incorporar esclarecimentos sustentados nas contribuições, com autoria e devolutiva, sem simular assinatura da área.

**Arquitetura:** histórico editorial separado das revisões humanas e validações das áreas. O snapshot original é preservado. A leitura aplica os textos editoriais antes dos detalhes efetivamente assinados pelas áreas.

**Restrições:** nenhum dado de paciente; RLS por mapa; importação administrativa sem identidade humana simulada; sugestões permanecem propostas; nenhum sinal verde deriva da consolidação.

## Entregas e verificação

- [x] Criar testes de precedência, fonte, perguntas pendentes, alterações do diagrama e ausência de validação implícita.
- [x] Criar ledger editorial append-only com RLS, vínculo à contribuição e versão, autoria obtida no banco e auditoria. Testar acesso cruzado, revogação e tentativa de escrita pelo participante.
- [x] Aplicar consolidação na API, matriz, painel de detalhes, lista de validação e devolutivas. Manter revisão da área como fonte prioritária.
- [x] Melhorar legendas das passagens, disposição das decisões e separar percursos de consulta, guarda e transferência. Expor decisões sem abrir opções avançadas.
- [x] Importar decisões protegidas de forma idempotente; conferir contagens e ausência de assinaturas.
- [ ] Executar testes, TypeScript, browser, build e auditoria; revisão independente; abrir PR e acompanhar CI.

## Casos de revisão

Mapas sem consolidação conservam o comportamento atual. Revisões de outra versão ou atividade desconhecida não são aplicadas. Uma nova pendência editorial retira o texto anterior daquela atividade. Uma revisão de área prevalece sobre texto editorial. Fontes e propostas são visíveis sem publicar comentários brutos de colegas.
