# Avaliações e sugestões dos alunos — GIP

Implementação de 9 de setembro de 2026. O módulo integra o Meu GIP e a gestão acadêmica. Não altera presença, carga horária ou scores de saúde.

## Operação
- /avaliacoes: avaliações disponíveis, histórico, devolutivas, avaliação anônima do programa e mural.
- /avaliacoes/[id]: avaliação do curso com cinco estrelas e comentário obrigatório; Avançar salva a avaliação antes da etapa anônima.
- /avaliacoes/sugestoes: categoria, manifestação e proposta opcional.
- /gestao-avaliacoes: criação por ciclo/turma, caixa restrita, encaminhamentos e sínteses revisadas.
- /gestao-avaliacoes/[id]: pendências identificadas, respostas enviadas, devolutivas e resultados agrupados.

A coordenação configura título, tipo, etapa (inicial/módulo/final) e datas em Brasília. Módulo exige capacitação selecionada.

Em 10/09/2026, a avaliação identificada do curso (`self`) passa a usar `course_rating` (inteiro obrigatório de 1 a 5, apresentado em estrelas) e `course_review` (comentário obrigatório de 20 a 1.500 caracteres, sem espaços nas extremidades). O aluno escolhe as estrelas, escreve sua avaliação e clica em **Avançar**. A gravação precisa ser confirmada antes de abrir a etapa de sugestão anônima. Um rascunho pode ser salvo sem estrelas ou com comentário incompleto. O texto não é publicado no mural.

O banco aceita esse formato como alternativa ao instrumento anterior, sem converter notas de aprendizagem em satisfação ou reescrever registros. Respostas e versões antigas preservam suas perguntas; rascunhos antigos continuam editáveis no formulário anterior. Campanhas existentes usam o formulário simples para novas respostas. A avaliação anônima do programa mantém suas seis dimensões e suas regras de agregação. Nenhum score de saúde foi alterado. Mudanças exigem atualizar tipos, banco e testes.


A segunda etapa usa `/avaliacoes/sugestoes?etapa=melhoria`: uma caixa para sugestão ou crítica, sem enviar campanha, resposta, matrícula ou perfil. O parâmetro da página é genérico e não identifica o aluno ou curso. O aluno pode concluir sem sugestão; se escrever, o texto exige 10 a 3.000 caracteres. O envio usa a caixa anônima existente, categoria `aulas`, proposta vazia e nonce aleatório independente da avaliação identificada. Não registra no histórico se a pessoa enviou ou pulou a etapa. Um link genérico no histórico permite retomar essa etapa se a navegação for interrompida.

A mensagem acolhe críticas como parte da primeira avaliação e explica que o nome não acompanha a sugestão. Ela não promete impossibilidade de rastreamento: detalhes identificáveis no próprio texto e registros técnicos da infraestrutura limitam o anonimato. Depois de iniciar o envio, o texto e o nonce são mantidos iguais nas tentativas seguintes para evitar duplicidade em caso de resposta de rede incerta. Não há rascunho anônimo salvo no cadastro ou no armazenamento local do navegador.

## Permissões e registros
Conta aprovada e ativa é obrigatória. Enviar exige papel acadêmico, vínculo ativo em ciclo não cancelado e matrícula não cancelada quando há capacitação. O histórico próprio permanece disponível após perda do vínculo, enquanto a conta estiver aprovada e ativa.

Administradores e coordenadores gerenciam o módulo. Professor colaborador lê e orienta somente autoavaliações das capacitações em que é instrutor. Rascunhos permanecem privados, inclusive após reabertura.

Há uma resposta por aluno/campanha. Revisão concorrente é conferida no banco. Cada envio gera versão imutável; a reabertura é justificada, auditada e exige campanha aberta no prazo. Devolutivas são registros adicionais.

RLS e GRANT protegem acesso direto ao banco. RPCs públicas são invoker; núcleos privados definer têm autorização explícita e atendem às escritas atômicas e à agregação sem leitura bruta. Nenhuma credencial privilegiada vai ao cliente.

## Anonimato e limites
Respostas anônimas não armazenam autor, matrícula, e-mail, sessão, IP ou horário. Sugestões guardam apenas o mês. Nonce aleatório em memória evita reenvio acidental; reutilização com conteúdo divergente falha. Não há auditoria do autor nesses envios nem gravação dos corpos/erros brutos pela aplicação.

A conta verifica elegibilidade. Operadores da infraestrutura podem ter logs técnicos; a interface informa essa limitação. Conferir configurações reais de logs, retenção e acesso operacional antes do piloto. Não habilitar gravação de sessão ou analytics com conteúdo nos formulários.

O limite de abuso é global por canal: 120 envios/minuto, em contador privado sem conta, campanha, IP ou conteúdo. Não impede todos os envios repetidos intencionais.

Nenhum cliente lê respostas brutas do programa. Agregados somente após encerramento explícito e imutável, com ao menos cinco respostas totais e cinco notas válidas por dimensão. O limiar conta respostas, não cinco pessoas distintas, e não garante por si só anonimato estatístico. Orientar um envio por avaliação. Não usar o instrumento anônimo para ranking, nota, certificação ou taxa individual de participação.

Textos brutos de sugestões são restritos à coordenação/administração. O mural usa tabela separada com síntese revisada, nunca publica automaticamente o original. Planejamento publicado exige responsável e prazo. Remover a marca de publicação retira o item do mural. Revisões do gestor são auditadas sem textos brutos.

## Piloto e rotina
1. Confirmar login, aprovação, vínculo e matrículas no ambiente publicado.
2. A coordenação cria uma avaliação de teste, confere tipo, público e período.
3. Explicar aprendizagem identificada versus manifestações anônimas aos participantes.
4. Conferir rascunho, novo login, envio, devolutiva e mural em celular e computador.
5. Nomear responsável pela caixa, propor análise semanal e devolutiva mensal.
6. Definir e divulgar o prazo institucional de conservação e o canal de pedidos sobre dados.
7. Após validar o piloto, abrir para os demais alunos elegíveis.

Não coletar dados identificáveis de pacientes. Não há e-mail, automação ou descarte automático de registros pedagógicos nesta versão. Prazos de revisão e conservação dependem da rotina institucional.

## Validação e publicação

### Simplificação do curso — 10/09/2026

`npm test` passou com 64 testes, incluindo replay das 12 migrações em PostgreSQL temporário, classificação e comentário obrigatórios, preservação exata das respostas, repetição de envio sem duplicidade e RLS. `npm run build` concluiu localmente e `npm audit` não encontrou vulnerabilidades.

Os componentes reais foram exercitados no navegador em uma página temporária de demonstração local, com gravação simulada: cinco radios, comentário obrigatório, bloqueio de comentário vazio ou insuficiente após remover espaços, manutenção das respostas após erro e navegação após confirmação. A página protegida mantém a exigência de login. A segunda etapa foi testada separadamente: texto sem identificadores no payload, falha com texto preservado, nova tentativa com nonce e conteúdo idênticos e confirmação com limpeza do texto. A primeira revisão também verificou teclado e rascunho sem nota. A página temporária foi removida antes do commit; nenhum envio de aluno foi criado em produção. Essa verificação visual não equivale a um teste de login de aluno na implantação final.

As migrações `20260910030538_simplify_course_evaluation.sql` e `20260910032118_require_course_review.sql` já foram aplicadas no Supabase. A segunda exige o comentário mínimo no envio final, mantendo rascunhos e respostas antigas. Não havia respostas nem rascunhos no novo formato antes da alteração. A conferência somente de leitura confirmou aceitação do novo formato e rejeição de classificação ausente ou nula. Advisors de segurança foram executados novamente: permanecem somente os avisos anteriores descritos abaixo. O código da interface depende da revisão e integração do PR antes de entrar em produção.

### Registro da implantação inicial — PR #12
npm test inclui testes de regras reais e replay de todas as migrações em PostgreSQL temporário (PGlite), com fixtures sintéticas e rollback. Simula apenas serviços básicos auth/storage; as políticas e funções da aplicação são reais. Testa autorização, RLS, matrícula, prazos, versões, devolutivas, privacidade, agregação, nonce e limite de envios.

npm test passou localmente; o código compilou e a tipagem passou, mas o build local não concluiu a geração das páginas por ENOSPC (disco cheio). A validação do PR #12 concluiu npm ci, npm test, npm run build e npm audit com sucesso em GitHub Actions (execução 34422500335). A prévia Vercel também concluiu o deploy. Isso não substitui o teste manual de login e logs no ambiente hospedado.

Next.js 15.5.25, sharp 0.35.4 e dependências transitivas foram atualizados; a auditoria local terminou sem vulnerabilidades. A migração foi aplicada no Supabase como 20260910004512_student_evaluations_and_anonymous_suggestions.sql. A verificação confirmou RLS nas sete tabelas e ausência de leitura pública. Advisors executados: permanece o aviso anterior de proteção contra senhas vazadas desativada; há dois informes RLS sem policy nas tabelas intencionalmente inacessíveis aos clientes (respostas anônimas brutas e contador privado). Esses informes não concedem acesso. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. Produção usa main: respeitar revisão do PR antes de merge, conforme docs/HANDOFF_ANTIGRAVITY.md.


A revisão visual autenticada permanece pendente: a prévia exige login Vercel e o Chrome não conseguiu abrir por falta de espaço no disco. Nenhuma campanha foi aberta automaticamente. A coordenação deve preparar o primeiro instrumento e validar o piloto antes de liberar respostas.

O disco local ficou cheio durante o build. As últimas correções/documentação e o alinhamento do nome da migração foram salvos diretamente na branch do PR. Após liberar espaço, reconciliar a worktree por avanço linear preservando as alterações locais conhecidas; não usar reset --hard nem sobrescrever trabalho desconhecido.
