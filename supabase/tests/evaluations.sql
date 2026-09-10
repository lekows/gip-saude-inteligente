-- Run against a disposable database containing all GIP migrations, as postgres.
-- This suite uses synthetic users only. Every fixture and assertion is rolled back.
-- No pgTAP extension is required; any unexpected result raises an exception.
begin;

create temporary table evaluation_test_ids(n integer primary key, id uuid not null default gen_random_uuid());
insert into evaluation_test_ids(n) select generate_series(1, 220);
grant select on evaluation_test_ids to authenticated, anon;

create function pg_temp.f(p_n integer) returns uuid language sql stable as $$
  select id from pg_temp.evaluation_test_ids where n = p_n;
$$;
create function pg_temp.login(p_n integer) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(pg_temp.f(p_n)::text, ''), true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', pg_temp.f(p_n), 'role', 'authenticated')::text, true);
end;
$$;
create function pg_temp.assert_true(p_condition boolean, p_label text) returns void language plpgsql as $$
begin
  if p_condition is distinct from true then raise exception 'FAILED: %', p_label; end if;
end;
$$;
create function pg_temp.expect_error(p_sql text, p_state text, p_label text) returns void language plpgsql as $$
declare v_state text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    if v_state = p_state then return; end if;
    raise exception 'FAILED: %, expected SQLSTATE %, received %', p_label, p_state, v_state;
  end;
  raise exception 'FAILED: %, statement unexpectedly succeeded', p_label;
end;
$$;
create function pg_temp.self_answers() returns jsonb language sql immutable as $$
  select '{"comprehension":4,"confidence":3,"participation":5,"communication":4,"application":null,"learning":"Aprendizado sintetico","difficulties":"","support":"","next_step":"Revisar os materiais"}'::jsonb;
$$;
create function pg_temp.program_answers() returns jsonb language sql immutable as $$
  select '{"organization":4,"content":5,"mentoring":4,"practice":3,"infrastructure":null,"satisfaction":4}'::jsonb;
$$;

select set_config('app.admin_profile_write', 'on', true);
insert into auth.users(id, email, raw_user_meta_data)
  select pg_temp.f(n), 'gip-test-' || pg_temp.f(n)::text || '@example.invalid',
    jsonb_build_object('full_name', 'Participante sintetico ' || n) from generate_series(1, 16) n;
update public.profiles set account_status = case
    when id = pg_temp.f(7) then 'pendente'::public.account_status
    when id = pg_temp.f(8) then 'suspenso'::public.account_status else 'aprovado'::public.account_status end,
  active = id <> pg_temp.f(9),
  role = case
    when id = pg_temp.f(1) then 'administrador'::public.app_role
    when id = pg_temp.f(2) then 'professor_coordenador'::public.app_role
    when id in (pg_temp.f(3), pg_temp.f(4)) then 'professor_colaborador'::public.app_role
    when id = pg_temp.f(10) then 'gestor_municipal'::public.app_role
    else 'academico_participante'::public.app_role end
  where id in (select pg_temp.f(n) from generate_series(1, 16) n);
insert into public.profile_permissions(profile_id, permission, granted_by)
  values (pg_temp.f(11), 'gerenciar_usuarios', pg_temp.f(1));
insert into public.program_cycles(id, name, start_date, end_date, status)
  values (pg_temp.f(100), 'Ciclo sintetico', current_date - 10, current_date + 90, 'ativo'),
    (pg_temp.f(109), 'Outro ciclo sintetico', current_date - 10, current_date + 90, 'ativo');
insert into public.training_modules(id, title, workload_hours)
  values (pg_temp.f(101), 'Modulo sintetico', 4);
insert into public.training_classes(id, cycle_id, module_id, instructor_id, title, starts_at, ends_at, status)
  values (pg_temp.f(102), pg_temp.f(100), pg_temp.f(101), pg_temp.f(3), 'Turma sintetica', now(), now() + interval '4 hours', 'aberta'),
    (pg_temp.f(103), pg_temp.f(100), pg_temp.f(101), pg_temp.f(4), 'Outra turma sintetica', now(), now() + interval '4 hours', 'aberta');
insert into public.program_members(id, cycle_id, profile_id, member_role, status)
  select pg_temp.f(20+n), pg_temp.f(100), pg_temp.f(n), 'academico_participante', 'ativo'
  from generate_series(5,16) n where n <> 13;
insert into public.training_enrollments(class_id, member_id, status)
  select pg_temp.f(102), pg_temp.f(20+n), case when n = 12 then 'cancelado'::public.enrollment_status else 'inscrito'::public.enrollment_status end
  from generate_series(5,16) n where n <> 13;

select pg_temp.login(1);
insert into public.evaluation_campaigns(id, cycle_id, class_id, title, kind, stage, opens_at, closes_at, status)
  values
    (pg_temp.f(110), pg_temp.f(100), pg_temp.f(102), 'Autoavaliacao sintetica', 'self', 'module', now()-interval '1 day', now()+interval '1 day', 'open'),
    (pg_temp.f(111), pg_temp.f(100), pg_temp.f(102), 'Programa sintetico', 'program', 'module', now()-interval '1 day', now()+interval '1 day', 'open'),
    (pg_temp.f(112), pg_temp.f(100), pg_temp.f(102), 'Avaliacao encerrada', 'self', 'final', now()-interval '2 days', now()-interval '1 day', 'closed'),
    (pg_temp.f(113), pg_temp.f(100), pg_temp.f(102), 'Avaliacao futura', 'self', 'initial', now()+interval '1 day', now()+interval '2 days', 'open'),
    (pg_temp.f(114), pg_temp.f(100), pg_temp.f(102), 'Avaliacao rascunho', 'self', 'initial', now()-interval '1 day', now()+interval '1 day', 'draft'),
    (pg_temp.f(115), pg_temp.f(100), null, 'Avaliacao geral', 'self', 'initial', now()-interval '1 day', now()+interval '1 day', 'open'),
    (pg_temp.f(116), pg_temp.f(100), pg_temp.f(103), 'Avaliacao outra turma', 'self', 'module', now()-interval '1 day', now()+interval '1 day', 'open'),
    (pg_temp.f(117), pg_temp.f(100), pg_temp.f(102), 'Programa grupo pequeno', 'program', 'final', now()-interval '1 day', now()+interval '1 day', 'open');

-- Privileges, RLS, fixed search paths and separation of anonymous payloads.
select pg_temp.assert_true((select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('evaluation_campaigns','evaluation_responses','evaluation_response_versions',
    'evaluation_feedback','anonymous_program_responses','anonymous_suggestions','suggestion_publications')), 'all module tables have RLS');
select pg_temp.assert_true(not has_table_privilege('anon','public.evaluation_campaigns','SELECT')
  and not has_table_privilege('anon','public.anonymous_suggestions','INSERT')
  and not has_table_privilege('authenticated','public.anonymous_program_responses','SELECT')
  and not has_table_privilege('authenticated','public.evaluation_responses','INSERT')
  and not has_table_privilege('authenticated','public.evaluation_responses','UPDATE')
  and not has_table_privilege('authenticated','public.evaluation_responses','DELETE'), 'minimum table grants');
select pg_temp.assert_true(not exists (select 1 from information_schema.columns
  where table_schema='public' and table_name in ('anonymous_program_responses','anonymous_suggestions')
    and column_name in ('profile_id','author_id','user_id','created_at','submitted_at','updated_at','ip','session_id','email')),
  'anonymous tables contain no identity or precise submission time');
select pg_temp.assert_true(not exists (select 1 from information_schema.columns
  where table_schema='public' and table_name='suggestion_publications' and column_name in ('message','proposal','nonce')),
  'publications cannot expose raw suggestion fields');
select pg_temp.assert_true(not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('save_evaluation_response','reopen_evaluation_response','add_evaluation_feedback',
    'submit_anonymous_program_evaluation','submit_anonymous_suggestion','review_anonymous_suggestion','get_program_evaluation_summary','get_evaluation_roster')
    and (p.prosecdef or p.proconfig is null)), 'public RPCs use invoker with fixed search_path');

set local role anon;
select pg_temp.login(null);
select pg_temp.expect_error('select * from public.evaluation_campaigns', '42501', 'anonymous users cannot read campaigns');
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''site'',''Sugestao sintetica valida'',null,gen_random_uuid())', '42501', 'anonymous login cannot submit');

set local role authenticated;
select pg_temp.login(7);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_campaigns), 'pending accounts see no campaigns');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),pg_temp.self_answers(),true,0)', '42501', 'pending account cannot submit');
select pg_temp.login(8);
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),pg_temp.self_answers(),true,0)', '42501', 'suspended account cannot submit');
select pg_temp.login(9);
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''site'',''Sugestao sintetica valida'',null,gen_random_uuid())', '42501', 'inactive profile cannot suggest');
select pg_temp.login(12);
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),pg_temp.self_answers(),true,0)', '42501', 'cancelled enrollment cannot submit');
select pg_temp.login(13);
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),pg_temp.self_answers(),true,0)', '42501', 'nonmember cannot submit');
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''site'',''Sugestao sintetica valida'',null,gen_random_uuid())', '42501', 'nonmember cannot suggest');

select pg_temp.login(5);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_campaigns where id=pg_temp.f(114)), 'students do not see drafts');
select pg_temp.expect_error('insert into public.evaluation_campaigns(cycle_id,title,kind,stage,opens_at,closes_at) values(pg_temp.f(100),''Campanha indevida'',''self'',''initial'',now(),now()+interval ''1 day'')', '42501', 'students cannot create campaigns');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(112),pg_temp.self_answers(),true,0)', '23514', 'closed deadline rejects submissions');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(113),pg_temp.self_answers(),true,0)', '23514', 'future opening rejects submissions');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(114),pg_temp.self_answers(),true,0)', '23514', 'draft campaign rejects submissions');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(111),pg_temp.self_answers(),true,0)', '23514', 'program cannot store an identified response');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"comprehension":6}''::jsonb,false,0)', '23514', 'ratings outside scale rejected');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"comprehension":"4"}''::jsonb,false,0)', '23514', 'string ratings rejected');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"email":"synthetic@example.invalid"}''::jsonb,false,0)', '23514', 'unknown identity fields rejected');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{}''::jsonb,true,0)', '23514', 'incomplete final answers rejected');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),jsonb_build_object(''learning'',repeat(''x'',1501)),false,0)', '23514', 'long texts rejected');
select public.save_evaluation_response(pg_temp.f(110), '{"comprehension":4}'::jsonb, false, 0);
select pg_temp.assert_true((select count(*)=1 from public.evaluation_responses where campaign_id=pg_temp.f(110) and status='draft' and revision=1), 'draft is saved');
select pg_temp.assert_true((select count(*)=0 from public.evaluation_response_versions), 'draft does not create submitted snapshot');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),pg_temp.self_answers(),false,0)', '40001', 'stale revision cannot overwrite draft');

select pg_temp.login(6);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_responses), 'peer cannot read another student draft');
select pg_temp.login(3);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_responses), 'instructor cannot read draft content');
select pg_temp.assert_true((select status='draft' from public.get_evaluation_roster(pg_temp.f(110)) where profile_id=pg_temp.f(5)), 'instructor roster shows pending work without draft content');
select pg_temp.assert_true((select count(*)=0 from public.get_evaluation_roster(pg_temp.f(110)) where profile_id in (pg_temp.f(7),pg_temp.f(8),pg_temp.f(9),pg_temp.f(12))), 'roster omits ineligible accounts/enrollment');
select pg_temp.expect_error('select * from public.get_evaluation_roster(pg_temp.f(115))', '42501', 'instructor cannot review general cycle roster');
select pg_temp.expect_error('select * from public.get_evaluation_roster(pg_temp.f(111))', '42501', 'program has no participant submission roster');
select pg_temp.login(4);
select pg_temp.expect_error('select * from public.get_evaluation_roster(pg_temp.f(110))', '42501', 'unassigned instructor cannot read roster');
select pg_temp.login(1);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_responses), 'manager also cannot read draft content');

select pg_temp.login(5);
select public.save_evaluation_response(pg_temp.f(110), pg_temp.self_answers(), true, 1);
select pg_temp.assert_true((select count(*)=1 from public.evaluation_responses where status='submitted' and revision=2 and submitted_at is not null), 'submitted response persists with server date');
select pg_temp.assert_true((select count(*)=1 from public.evaluation_response_versions where revision=2), 'submission snapshots answers');
select public.save_evaluation_response(pg_temp.f(110), pg_temp.self_answers(), true, 1);
select pg_temp.assert_true((select count(*)=1 from public.evaluation_response_versions), 'retry does not duplicate submission or history');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),pg_temp.self_answers() || ''{"confidence":5}''::jsonb,true,2)', '23514', 'submitted content immutable');
select pg_temp.expect_error('update public.evaluation_responses set answers=''{}''::jsonb', '42501', 'direct update cannot bypass revision checks');
select pg_temp.expect_error('delete from public.evaluation_responses', '42501', 'direct deletion cannot erase history');
select pg_temp.expect_error('select public.reopen_evaluation_response((select id from public.evaluation_responses limit 1),''Correcao sintetica autorizada'')', '42501', 'student cannot reopen');
select pg_temp.login(6);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_responses), 'peer cannot read submitted answers');
select pg_temp.assert_true((select count(*)=0 from public.evaluation_response_versions), 'peer cannot read version history');
select pg_temp.login(4);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_responses), 'unassigned instructor cannot read submitted answers');
select pg_temp.login(3);
select pg_temp.assert_true((select count(*)=1 from public.evaluation_responses), 'assigned instructor reads submitted answers');
select public.add_evaluation_feedback((select id from public.evaluation_responses limit 1), 'Devolutiva pedagogica sintetica.');
select pg_temp.login(5);
select pg_temp.assert_true((select count(*)=1 from public.evaluation_feedback), 'student sees own teacher feedback');
select pg_temp.expect_error('select public.add_evaluation_feedback((select id from public.evaluation_responses limit 1),''Feedback indevido.'')', '42501', 'student cannot impersonate reviewer');

select pg_temp.login(2);
select public.reopen_evaluation_response((select id from public.evaluation_responses limit 1), 'Correcao sintetica autorizada pela coordenacao.');
select pg_temp.assert_true((select count(*)=1 from public.audit_logs where action='reopen_evaluation' and actor_id=pg_temp.f(2)), 'reopening is audited');
select pg_temp.login(5);
select pg_temp.assert_true((select status='draft' and revision=3 from public.evaluation_responses limit 1), 'reopening creates a new draft revision');
select pg_temp.assert_true((select count(*)=1 from public.evaluation_response_versions), 'original submitted snapshot survives reopening');
select public.save_evaluation_response(pg_temp.f(110),pg_temp.self_answers() || '{"confidence":5}'::jsonb,true,3);
select pg_temp.assert_true((select count(*)=2 from public.evaluation_response_versions), 'corrected submission preserves both versions');

-- Anonymous submission payloads are validated and de-duplicated by random nonce.
select pg_temp.expect_error('select public.submit_anonymous_program_evaluation(pg_temp.f(110),pg_temp.program_answers(),gen_random_uuid())', '23514', 'self campaign cannot accept anonymous program answers');
select pg_temp.expect_error('select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers() || ''{"comment":"identifiable text"}''::jsonb,gen_random_uuid())', '23514', 'program ratings reject free text');
select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers(),pg_temp.f(200));
select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers(),pg_temp.f(200));
select pg_temp.expect_error('select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers() || ''{"content":1}''::jsonb,pg_temp.f(200))', '23514', 'nonce cannot silently replace program content');
select pg_temp.expect_error('select public.submit_anonymous_program_evaluation(pg_temp.f(117),pg_temp.program_answers(),pg_temp.f(200))', '23514', 'nonce cannot silently drop another campaign submission');
select public.submit_anonymous_program_evaluation(pg_temp.f(117),pg_temp.program_answers(),pg_temp.f(205));
select pg_temp.expect_error('select * from public.anonymous_program_responses', '42501', 'student cannot read raw anonymous ratings');
select pg_temp.expect_error('select public.get_program_evaluation_summary(pg_temp.f(111))', '42501', 'student cannot query reviewer aggregate');
select public.submit_anonymous_suggestion('site','Texto sintetico original restrito a coordenacao.','Melhorar a navegacao.',pg_temp.f(210));
select public.submit_anonymous_suggestion('site','Texto sintetico original restrito a coordenacao.','Melhorar a navegacao.',pg_temp.f(210));
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''site'',''Conteudo diferente para o mesmo envio.'',null,pg_temp.f(210))', '23514', 'nonce cannot silently replace suggestion content');
select pg_temp.assert_true((select count(*)=0 from public.anonymous_suggestions), 'student cannot read raw suggestions including own');
select pg_temp.assert_true((select count(*)=0 from public.suggestion_publications), 'unreviewed suggestion is not published');
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''site'',''curto'',null,gen_random_uuid())', '23514', 'short suggestion rejected');
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''invalido'',''Sugestao sintetica valida'',null,gen_random_uuid())', '23514', 'unknown suggestion category rejected');

select pg_temp.login(6);
select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers(),pg_temp.f(201));
select pg_temp.login(14);
select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers(),pg_temp.f(202));
select pg_temp.login(15);
select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers(),pg_temp.f(203));
select pg_temp.login(16);
select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers() || '{"infrastructure":5}'::jsonb,pg_temp.f(204));
select pg_temp.login(1);
select pg_temp.expect_error('select * from public.anonymous_program_responses', '42501', 'manager cannot read raw anonymous ratings');
select pg_temp.assert_true(public.get_program_evaluation_summary(pg_temp.f(111))='{"available":false}'::jsonb, 'open campaign cannot reveal running aggregates');
update public.evaluation_campaigns set status='closed' where id in (pg_temp.f(111),pg_temp.f(117));
select pg_temp.assert_true(public.get_program_evaluation_summary(pg_temp.f(117))='{"available":false}'::jsonb, 'closed small group suppressed without exact count');
select pg_temp.assert_true((public.get_program_evaluation_summary(pg_temp.f(111))->>'response_count')::int=5, 'nonce retry was counted only once');
select pg_temp.assert_true(public.get_program_evaluation_summary(pg_temp.f(111))#>>'{ratings,organization,average}'='4.00', 'closed aggregate average correct');
select pg_temp.assert_true(public.get_program_evaluation_summary(pg_temp.f(111))#>'{ratings,infrastructure}'='null'::jsonb, 'dimension with fewer than five valid ratings is suppressed');
select pg_temp.expect_error('update public.evaluation_campaigns set status=''open'' where id=pg_temp.f(111)', '23514', 'closed program cannot reopen for differencing');
select pg_temp.expect_error('update public.evaluation_campaigns set class_id=null where id=pg_temp.f(110)', '23514', 'published scope cannot change');
select pg_temp.expect_error('insert into public.evaluation_campaigns(cycle_id,class_id,title,kind,stage,opens_at,closes_at) values(pg_temp.f(109),pg_temp.f(102),''Turma de outro ciclo'',''self'',''module'',now(),now()+interval ''1 day'')', '23514', 'class must belong to campaign cycle');
select pg_temp.expect_error('insert into public.evaluation_campaigns(cycle_id,title,kind,stage,opens_at,closes_at) values(pg_temp.f(100),''Modulo sem turma'',''self'',''module'',now(),now()+interval ''1 day'')', '23514', 'module campaign requires a class');
select pg_temp.assert_true((select count(*)=2 from public.audit_logs where entity_id=pg_temp.f(111)::text and action in ('create_evaluation_campaign','update_evaluation_campaign')), 'campaign creation and closure audited');
select pg_temp.assert_true((select count(*)=1 from public.audit_logs where actor_id=pg_temp.f(3) and action='add_evaluation_feedback' and not metadata ? 'message'), 'feedback audit omits pedagogical text');
select pg_temp.assert_true((select count(*)=1 from public.anonymous_suggestions where nonce=pg_temp.f(210)), 'suggestion retry de-duplicated');
select pg_temp.assert_true((select submitted_month=date_trunc('month',now() at time zone 'America/Sao_Paulo')::date from public.anonymous_suggestions where nonce=pg_temp.f(210)), 'suggestions retain month only');
select pg_temp.expect_error('select public.review_anonymous_suggestion((select id from public.anonymous_suggestions where nonce=pg_temp.f(210)),''declined'',null,null,null,true,''Sintese revisada de teste.'')', '23514', 'decline requires reviewed justification');
select pg_temp.expect_error('select public.review_anonymous_suggestion((select id from public.anonymous_suggestions where nonce=pg_temp.f(210)),''planned'',''Melhoria planejada.'',null,null,true,''Sintese revisada de teste.'')', '23514', 'planned publication requires owner and due date');
select public.review_anonymous_suggestion((select id from public.anonymous_suggestions where nonce=pg_temp.f(210)),
  'planned','A navegacao sera simplificada.','Coordenacao GIP',current_date+30,true,'Facilitar o acesso aos materiais.');
select pg_temp.login(5);
select pg_temp.assert_true((select count(*)=1 from public.suggestion_publications where summary='Facilitar o acesso aos materiais.'), 'student reads reviewed mural summary');
select pg_temp.assert_true((select count(*)=0 from public.anonymous_suggestions), 'publishing does not expose raw suggestions');
select pg_temp.login(10);
select pg_temp.assert_true((select count(*)=0 from public.anonymous_suggestions), 'municipal manager does not gain private educational access');
select pg_temp.login(11);
select pg_temp.assert_true((select count(*)=0 from public.anonymous_suggestions), 'user management permission alone does not expose anonymous text');
select pg_temp.expect_error('select public.get_program_evaluation_summary(pg_temp.f(111))', '42501', 'unrelated management permission does not authorize aggregate');
select pg_temp.login(5);
select pg_temp.expect_error('select public.submit_anonymous_program_evaluation(pg_temp.f(111),pg_temp.program_answers(),gen_random_uuid())', '23514', 'closed program rejects new data');

-- Flood protection shares a counter per channel, never an account identifier.
select pg_temp.expect_error('select * from private.evaluation_submission_limits', '42501', 'submission budgets are private');
select pg_temp.expect_error('select private.consume_anonymous_submission_budget(''suggestion'')', '42501', 'client cannot manipulate shared budget directly');
reset role;
select pg_temp.assert_true((select submission_count=1 from private.evaluation_submission_limits where bucket='suggestion'), 'retry does not consume a second budget unit');
select pg_temp.assert_true(not exists(select 1 from information_schema.columns where table_schema='private'
  and table_name='evaluation_submission_limits' and column_name in ('profile_id','user_id','ip','campaign_id','suggestion_id','nonce')), 'budget does not track author or payload');
update private.evaluation_submission_limits set window_start=date_trunc('minute',statement_timestamp()), submission_count=119 where bucket='suggestion';
set local role authenticated;
select pg_temp.login(5);
select public.submit_anonymous_suggestion('site','Ultimo envio do limite global sintetico.',null,pg_temp.f(211));
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''site'',''Envio excede o limite global sintetico.'',null,pg_temp.f(212))', '54000', 'flood exceeding shared budget rejected');
select public.submit_anonymous_suggestion('site','Ultimo envio do limite global sintetico.',null,pg_temp.f(211));
reset role;
select pg_temp.assert_true((select submission_count=120 from private.evaluation_submission_limits where bucket='suggestion'), 'last allowed submission is atomic and retry idempotent');
update private.evaluation_submission_limits set window_start=date_trunc('minute',statement_timestamp())-interval '1 minute' where bucket='suggestion';
set local role authenticated;
select public.submit_anonymous_suggestion('site','Envio de nova janela global sintetica.',null,pg_temp.f(213));
reset role;
select pg_temp.assert_true((select submission_count=1 from private.evaluation_submission_limits where bucket='suggestion'), 'new time window resets shared counter');
set local role authenticated;

-- Leaving a course does not erase the student's own historical learning record.
reset role;
update public.program_members set status='inativo' where id=pg_temp.f(25);
set local role authenticated;
select pg_temp.login(5);
select pg_temp.assert_true((select count(*)=1 from public.evaluation_responses where campaign_id=pg_temp.f(110)), 'former member retains own response history');
select pg_temp.assert_true((select count(*)=2 from public.evaluation_response_versions), 'former member retains submitted versions');
select pg_temp.assert_true((select count(*)=1 from public.evaluation_feedback), 'former member retains feedback');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(115),pg_temp.self_answers(),true,0)', '42501', 'inactive membership cannot submit');
select pg_temp.expect_error('select public.submit_anonymous_suggestion(''site'',''Sugestao sintetica valida'',null,gen_random_uuid())', '42501', 'inactive membership cannot suggest');

reset role;
select pg_temp.assert_true((select count(*)=0 from public.audit_logs where actor_id in (pg_temp.f(5),pg_temp.f(6),pg_temp.f(14),pg_temp.f(15),pg_temp.f(16))
  and action in ('submit_anonymous_suggestion','submit_anonymous_program_evaluation')), 'anonymous submission has no author audit');
select pg_temp.assert_true((select count(*)=5 from public.anonymous_program_responses where campaign_id=pg_temp.f(111)), 'underlying submission count is stable');
select pg_temp.assert_true((select count(*)=0 from public.evaluation_responses where campaign_id=pg_temp.f(111)), 'program never creates an identified response');

-- The simplified course format uses the same authorization, revision and history rules.
select pg_temp.assert_true(not exists(select 1 from information_schema.columns where table_schema='public'
  and table_name='anonymous_suggestions' and column_name in ('campaign_id','response_id','evaluation_id','enrollment_id','class_id','member_id')),
  'anonymous course suggestions cannot link back to the identified evaluation or enrollment');
set local role authenticated;
select pg_temp.login(14);
select public.save_evaluation_response(pg_temp.f(110), '{"course_review":"Comentario sintetico valido"}'::jsonb, false, 0);
select pg_temp.assert_true((select status='draft' and revision=1 and answers->>'course_review'='Comentario sintetico valido' from public.evaluation_responses where campaign_id=pg_temp.f(110)), 'course comment draft survives without a rating');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_review":""}''::jsonb,true,1)', '23514', 'course final needs stars');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":null}''::jsonb,true,1)', '23514', 'course stars do not accept N/A');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":"4"}''::jsonb,true,1)', '23514', 'course stars cannot be text');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":6}''::jsonb,true,1)', '23514', 'course stars upper bound');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":0}''::jsonb,true,1)', '23514', 'course stars lower bound');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":2.5}''::jsonb,true,1)', '23514', 'course stars must be whole');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":4,"learning":"old"}''::jsonb,true,1)', '23514', 'course cannot mix legacy questions');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),jsonb_build_object(''course_rating'',4,''course_review'',repeat(''x'',1501)),true,1)', '23514', 'course comment length enforced by database');
select public.save_evaluation_response(pg_temp.f(110), '{"course_rating":4,"course_review":"Comentario sintetico valido"}'::jsonb, true, 1);
select public.save_evaluation_response(pg_temp.f(110), '{"course_rating":4,"course_review":"Comentario sintetico valido"}'::jsonb, true, 1);
select pg_temp.assert_true((select count(*)=1 from public.evaluation_response_versions where answers='{"course_rating":4,"course_review":"Comentario sintetico valido"}'::jsonb), 'course submission preserves exact answers and retry adds no duplicate');
select pg_temp.login(15);
select pg_temp.assert_true((select count(*)=0 from public.evaluation_responses where campaign_id=pg_temp.f(110)), 'peer cannot read course feedback');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":5}''::jsonb,true,0)', '23514', 'course review required');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),''{"course_rating":5,"course_review":"muito curto"}''::jsonb,true,0)', '23514', 'course review minimum length');
select pg_temp.expect_error('select public.save_evaluation_response(pg_temp.f(110),jsonb_build_object(''course_rating'',5,''course_review'',repeat('' '',30)||''curto''||chr(10)),true,0)', '23514', 'whitespace cannot satisfy course minimum');
select public.save_evaluation_response(pg_temp.f(110), jsonb_build_object('course_rating',5,'course_review',repeat('x',20)), true, 0);
select pg_temp.assert_true((select status='submitted' and answers=jsonb_build_object('course_rating',5,'course_review',repeat('x',20)) from public.evaluation_responses where campaign_id=pg_temp.f(110)), 'course accepts exactly twenty comment characters');
select pg_temp.login(3);
select pg_temp.assert_true((select count(*)=2 from public.evaluation_responses where campaign_id=pg_temp.f(110) and answers ? 'course_rating'), 'assigned reviewer sees submitted course feedback');
reset role;

rollback;
