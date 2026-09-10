# Avaliações e sugestões dos alunos — GIP

Implementação de 9 de setembro de 2026. O módulo integra o Meu GIP e a gestão acadêmica. Não altera presença, carga horária ou scores de saúde.

## Operação
- /avaliacoes: avaliações disponíveis, histórico, devolutivas, avaliação anônima do programa e mural.
- /avaliacoes/[id]: avaliação do curso com cinco estrelas e um comentário opcional; rascunho privado e envio confirmado após gravação.
- /avaliacoes/sugestoes: categoria, manifestação e proposta opcional.
- /gestao-avaliacoes: criação por ciclo/turma, caixa restrita, encaminhamentos e sínteses revisadas.
- /gestao-avaliacoes/[id]: pendências identificadas, respostas enviadas, devolutivas e resultados agrupados.

A coordenação configura título, tipo, etapa (inicial/módulo/final) e datas em Brasília. Módulo exige capacitação selecionada.

Em 10/09/2026, a avaliação identificada do curso (`self`) passa a usar `course_rating` (inteiro obrigatório de 1 a 5, apresentado em estrelas) e `course_review` (comentário opcional de até 1.500 caracteres). O aluno escolhe as estrelas, escreve se desejar e clica em **Enviar avaliação**, sem etapa extra de revisão. Um rascunho pode ser salvo sem estrelas. O texto não é publicado no mural.

O banco aceita esse formato como alternativa ao instrumento anterior, sem converter notas de aprendizagem em satisfação ou reescrever registros. Respostas e versões antigas preservam suas perguntas; rascunhos antigos continuam editáveis no formulário anterior. Campanhas existentes usam o formulário simples para novas respostas. A avaliação anônima do programa mantém suas seis dimensões e suas regras de agregação. Nenhum score de saúde foi alterado. Mudanças exigem atualizar tipos, banco e testes.

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

`npm test` passou com 64 testes, incluindo replay das 11 migrações em PostgreSQL temporário, classificação obrigatória, comentário opcional, preservação exata das respostas, repetição de envio sem duplicidade e RLS. `npm run build` concluiu localmente e `npm audit` não encontrou vulnerabilidades.

O componente real foi exercitado no navegador em uma página temporária de demonstração local, com gravação simulada: cinco radios, uma caixa de texto, bloqueio do envio sem estrelas, seleção pelo teclado, rascunho sem nota, manutenção das respostas após erro e confirmação com resumo. A página temporária foi removida antes do commit; nenhum envio de aluno foi criado em produção. Essa verificação visual não equivale a um teste de login de aluno na implantação final.

A migração aditiva `20260910030538_simplify_course_evaluation.sql` já foi aplicada no Supabase. A conferência somente de leitura confirmou aceitação do novo formato e rejeição de classificação ausente ou nula. Advisors de segurança foram executados novamente: permanecem somente os avisos anteriores descritos abaixo. O código da interface depende da revisão e integração do PR antes de entrar em produção.

### Registro da implantação inicial — PR #12
npm test inclui testes de regras reais e replay de todas as migrações em PostgreSQL temporário (PGlite), com fixtures sintéticas e rollback. Simula apenas serviços básicos auth/storage; as políticas e funções da aplicação são reais. Testa autorização, RLS, matrícula, prazos, versões, devolutivas, privacidade, agregação, nonce e limite de envios.

npm test passou localmente; o código compilou e a tipagem passou, mas o build local não concluiu a geração das páginas por ENOSPC (disco cheio). A validação do PR #12 concluiu npm ci, npm test, npm run build e npm audit com sucesso em GitHub Actions (execução 34422500335). A prévia Vercel também concluiu o deploy. Isso não substitui o teste manual de login e logs no ambiente hospedado.

Next.js 15.5.25, sharp 0.35.4 e dependências transitivas foram atualizados; a auditoria local terminou sem vulnerabilidades. A migração foi aplicada no Supabase como 20260910004512_student_evaluations_and_anonymous_suggestions.sql. A verificação confirmou RLS nas sete tabelas e ausência de leitura pública. Advisors executados: permanece o aviso anterior de proteção contra senhas vazadas desativada; há dois informes RLS sem policy nas tabelas intencionalmente inacessíveis aos clientes (respostas anônimas brutas e contador privado). Esses informes não concedem acesso. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. Produção usa main: respeitar revisão do PR antes de merge, conforme docs/HANDOFF_ANTIGRAVITY.md.


A revisão visual autenticada permanece pendente: a prévia exige login Vercel e o Chrome não conseguiu abrir por falta de espaço no disco. Nenhuma campanha foi aberta automaticamente. A coordenação deve preparar o primeiro instrumento e validar o piloto antes de liberar respostas.

O disco local ficou cheio durante o build. As últimas correções/documentação e o alinhamento do nome da migração foram salvos diretamente na branch do PR. Após liberar espaço, reconciliar a worktree por avanço linear preservando as alterações locais conhecidas; não usar reset --hard nem sobrescrever trabalho desconhecido.
