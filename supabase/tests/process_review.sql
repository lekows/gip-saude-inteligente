-- Disposable PostgreSQL only. Synthetic fixtures and every change are rolled back.
begin;
create temporary table process_test_ids(n integer primary key,id uuid not null default gen_random_uuid());
insert into process_test_ids(n) select generate_series(1,40);
grant select on process_test_ids to authenticated,anon;
create function pg_temp.f(n integer) returns uuid language sql stable as $$ select id from pg_temp.process_test_ids where process_test_ids.n=$1 $$;
create function pg_temp.login(n integer) returns void language plpgsql as $$ begin
 perform set_config('request.jwt.claim.sub',coalesce(pg_temp.f(n)::text,''),true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.f(n),'role','authenticated')::text,true);
end $$;
create function pg_temp.ok(value boolean,label text) returns void language plpgsql as $$ begin if value is distinct from true then raise exception 'FAILED: %',label;end if;end $$;
create function pg_temp.denied(sql text,state text,label text) returns void language plpgsql as $$ declare code text;begin
 begin execute sql;exception when others then get stacked diagnostics code=returned_sqlstate;if code=state then return;end if;raise exception 'FAILED: %, expected %, received %',label,state,code;end;
 raise exception 'FAILED: %, statement succeeded',label;
end $$;
select set_config('app.admin_profile_write','on',true);
insert into auth.users(id,email,raw_user_meta_data) select pg_temp.f(n),'process-test-'||n||'@example.invalid',jsonb_build_object('full_name','Conta fictícia '||n) from generate_series(1,8)n;
update public.profiles set account_status=case when id=pg_temp.f(7) then 'pendente'::public.account_status else 'aprovado'::public.account_status end,
 active=id<>pg_temp.f(8),role=case when id=pg_temp.f(1) then 'administrador'::public.app_role else 'academico_participante'::public.app_role end;
insert into public.health_units(id,name,city) values(pg_temp.f(20),'Unidade fictícia A','Luziânia'),(pg_temp.f(21),'Unidade fictícia B','Luziânia');
insert into public.process_maps(id,health_unit_id,title,content) values
 (pg_temp.f(22),pg_temp.f(20),'Mapa fictício A','{"macros":[{"id":"M01"}],"activities":[{"id":"M01.A01","macro":"M01"},{"id":"M01.A02","macro":"M01"},{"id":"M01.A03","macro":"M01"}],"flows":{"scoped":{"M01":{"base":{"edges":[{"from":"M01.A01","to":"M01.A02"}]}}}},"questions":[{"id":"Q01"}],"systems":[],"sources":[]}'::jsonb),
 (pg_temp.f(23),pg_temp.f(21),'Mapa fictício B','{"macros":[],"activities":[{"id":"B01"}],"questions":[],"systems":[],"sources":[]}'::jsonb);
select pg_temp.ok(not has_table_privilege('anon','public.process_maps','SELECT'),'anonymous grant revoked');
select pg_temp.ok(not has_table_privilege('authenticated','public.process_feedback','UPDATE') and not has_table_privilege('authenticated','public.process_feedback','DELETE') and not has_table_privilege('authenticated','public.process_feedback','TRUNCATE'),'feedback is append-only');
select pg_temp.ok(not has_column_privilege('authenticated','public.process_maps','content','UPDATE'),'snapshot cannot be edited');
select pg_temp.ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='submit_process_feedback' and p.prosecdef),'public RPC uses invoker');
set local role anon;
select pg_temp.login(null);
select pg_temp.denied('select * from public.process_maps','42501','anonymous map access');
set local role authenticated;
select pg_temp.login(2);
select pg_temp.ok((select count(*)=0 from public.process_maps),'approved user without invitation cannot read');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(30),''M01.A01'',''question'',''Pergunta fictícia válida'','''')','42501','uninvited cannot submit');
select pg_temp.denied('insert into public.process_review_members(map_id,profile_id,granted_by) values(pg_temp.f(22),pg_temp.f(2),pg_temp.f(2))','42501','cannot self-invite');
select pg_temp.login(1);
insert into public.process_review_members(map_id,profile_id,granted_by,participation) values
 (pg_temp.f(22),pg_temp.f(2),pg_temp.f(1),'reviewer'),(pg_temp.f(22),pg_temp.f(3),pg_temp.f(1),'reviewer'),
 (pg_temp.f(22),pg_temp.f(4),pg_temp.f(1),'viewer');
select pg_temp.denied('insert into public.process_review_members(map_id,profile_id,granted_by) values(pg_temp.f(22),pg_temp.f(7),pg_temp.f(1))','22023','cannot invite pending account');
-- Included within the existing transaction of process_review.sql, after its memberships are installed.
select pg_temp.login(2);
select pg_temp.denied('select public.assign_process_area(pg_temp.f(22),''M01'',''Arquivo'',pg_temp.f(2),true,null)','42501','no self designation');
select pg_temp.denied('insert into public.process_area_events(map_id,item_id,kind,actor,actor_name,note) values(pg_temp.f(22),''M01.A01'',''approved'',pg_temp.f(2),''Fake'',''Forjado'')','42501','no direct validation');
select pg_temp.login(1);
select public.assign_process_area(pg_temp.f(22),'M01','Arquivo',pg_temp.f(2),true,null);
select pg_temp.login(2);
create function pg_temp.sign(kind text, expected bigint, details jsonb default null) returns void language sql as $$
 select public.record_process_area(pg_temp.f(22),'M01.A01',kind,
 (select mandate from public.process_area_assignments where map_id=pg_temp.f(22)),expected,'Conferência fictícia de teste',details)
$$;
select pg_temp.denied('select pg_temp.sign(''approved'',0)','22023','approval needs details');
select pg_temp.denied('select pg_temp.sign(''revision'',0,''{}'')','22023','five fields required');
select pg_temp.sign('revision',0,'{"routine":"Relato fictício","owner":"Arquivo","records":"Planilha","handoff":"Recepção para arquivo","rules":"Conferir a entrega"}');
select pg_temp.ok(exists(select from public.process_area_events where kind='reopen' and item_id='M01.A02'),'handoff reopened');
select pg_temp.denied('select pg_temp.sign(''approved'',0)','40001','stale approval');
select pg_temp.login(3);
select pg_temp.denied('select pg_temp.sign(''approved'',1)','42501','different contributor cannot sign');
select pg_temp.login(2);
select pg_temp.sign('approved',(select max(id) from public.process_area_events where item_id='M01.A01'));
select pg_temp.sign('correction',(select max(id) from public.process_area_events where item_id='M01.A01'));
select pg_temp.denied('select pg_temp.sign(''approved'',(select max(id) from public.process_area_events where item_id=''M01.A01''))','22023','correction needs new revision');
select pg_temp.login(4);
select pg_temp.denied('select pg_temp.sign(''revision'',0)','42501','viewer cannot edit');
select pg_temp.login(1);
select public.assign_process_area(pg_temp.f(22),'M01','Arquivo',pg_temp.f(2),false,(select mandate from public.process_area_assignments where map_id=pg_temp.f(22)));
select pg_temp.login(2);
select pg_temp.denied('select pg_temp.sign(''approved'',0)','42501','withdrawn mandate');


select pg_temp.login(2);
select pg_temp.ok((select count(*)=1 from public.process_maps),'invited sees own map only');
select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(30),'M01.A01','change','Descrição fictícia de uma dúvida','Proposta fictícia para próxima visita');
select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(30),'M01.A01','change','Descrição fictícia de uma dúvida','Proposta fictícia para próxima visita');
select pg_temp.ok((select count(*)=1 from public.process_feedback),'retry is idempotent');
select pg_temp.ok((select count(*)=1 from public.process_feedback where author_id=pg_temp.f(2) and map_version=1),'author and version preserved');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(30),''Q01'',''question'',''Outra contribuição fictícia'','''')','22023','nonce cannot be reused with another payload');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(23),1,pg_temp.f(31),''B01'',''question'',''Descrição fictícia válida'','''')','42501','cross-unit submission denied');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),2,pg_temp.f(31),''M01.A01'',''question'',''Descrição fictícia válida'','''')','40001','stale map version denied');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(31),''UNKNOWN'',''question'',''Descrição fictícia válida'','''')','22023','unknown item denied');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(31),''M01.A01'',''change'',''Descrição fictícia válida'','''')','22023','change needs proposal');
select pg_temp.denied('insert into public.process_feedback(map_id,map_version,author_id,nonce,item_id,kind,message) values(pg_temp.f(22),1,pg_temp.f(3),gen_random_uuid(),''Q01'',''question'',''Descrição fictícia válida'')','42501','forged author denied');
select pg_temp.denied('insert into public.process_feedback_reviews(feedback_id,revision,decision,message,reviewer_id) select id,1,''accepted'',''Aprovação indevida'',pg_temp.f(2) from public.process_feedback','42501','student cannot review');
select pg_temp.denied('update public.process_maps set content=''{}''::jsonb','42501','student cannot overwrite map');
select pg_temp.login(3);
select pg_temp.ok((select count(*)=0 from public.process_feedback),'another student cannot see peer texts');
select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(32),'Q01','understood','Compreensão fictícia de uma etapa','');
select pg_temp.login(4);
select pg_temp.ok((select count(*)=1 from public.process_maps),'viewer can read map');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(33),''Q01'',''question'',''Descrição fictícia válida'','''')','42501','viewer cannot submit');
select pg_temp.login(1);
select pg_temp.ok((select count(*)=2 from public.process_feedback),'coordination sees feedback');
insert into public.process_feedback_reviews(feedback_id,revision,decision,message,reviewer_id)
 select id,1,'needs_information','Esclareça a passagem descrita na próxima visita.',pg_temp.f(1) from public.process_feedback where author_id=pg_temp.f(2);
select pg_temp.denied('insert into public.process_feedback_reviews(feedback_id,revision,decision,message,reviewer_id) select id,1,''accepted'',''Análise concorrente fictícia'',pg_temp.f(1) from public.process_feedback where author_id=pg_temp.f(2)','40001','stale coordination review denied');
insert into public.process_feedback_reviews(feedback_id,revision,decision,message,reviewer_id)
 select id,2,'accepted','Acolhida para discussão em próxima revisão.',pg_temp.f(1) from public.process_feedback where author_id=pg_temp.f(2);
select pg_temp.ok((select count(*)=2 from public.process_feedback_reviews),'analysis history append-only');
select pg_temp.ok((select content->'activities'->0->>'id'='M01.A01' from public.process_maps where id=pg_temp.f(22)),'accepted feedback does not modify snapshot');
select pg_temp.ok((select count(*)>=7 from public.audit_logs where entity_type like 'process_%'),'changes audit in database');
select pg_temp.login(2);
select pg_temp.ok((select count(*)=2 from public.process_feedback_reviews),'author sees own coordination replies');
select pg_temp.login(3);
select pg_temp.ok((select count(*)=0 from public.process_feedback_reviews),'peer replies private');
do $$ begin for i in 1..29 loop perform public.submit_process_feedback(pg_temp.f(22),1,gen_random_uuid(),'Q01','question','Pergunta fictícia para testar limite por hora','');end loop;end $$;
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,gen_random_uuid(),''Q01'',''question'',''Pergunta fictícia além do limite'','''')','54000','rate limit applies to direct RPC');
select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(32),'Q01','understood','Compreensão fictícia de uma etapa','');
select pg_temp.ok((select count(*)=30 from public.process_feedback),'idempotent retry still works at rate limit');
reset role;
update public.profiles set active=false where id=pg_temp.f(2);
set local role authenticated;
select pg_temp.login(2);
select pg_temp.ok((select count(*)=0 from public.process_maps),'suspension applies without JWT refresh');
reset role;
update public.profiles set active=true where id=pg_temp.f(2);
set local role authenticated;
select pg_temp.login(1);
update public.process_review_members set active=false,granted_by=pg_temp.f(1) where profile_id=pg_temp.f(2);
select pg_temp.login(2);
select pg_temp.ok((select count(*)=0 from public.process_maps),'revoked member loses access');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(34),''Q01'',''question'',''Descrição fictícia válida'','''')','42501','revocation blocks writes');
select pg_temp.login(1);
update public.process_maps set status='closed' where id=pg_temp.f(22);
select pg_temp.login(3);
select pg_temp.ok((select count(*)=1 from public.process_maps),'closed round remains readable');
select pg_temp.denied('select public.submit_process_feedback(pg_temp.f(22),1,pg_temp.f(35),''Q01'',''question'',''Descrição fictícia válida'','''')','42501','closed round cannot receive feedback');
rollback;
