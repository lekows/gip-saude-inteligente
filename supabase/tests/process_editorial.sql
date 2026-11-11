-- Included in the synthetic process_review transaction before memberships are revoked.
reset role;
select pg_temp.login(null);
insert into public.process_editorial_revisions(map_id,map_version,item_id,source_feedback_id,decision,details,pending_question,proposed_improvement,note,request_reference,diagram)
select pg_temp.f(22),1,'M01.A01',id,'accepted',
 '{"routine":"Rotina fictícia consolidada","owner":"Equipe fictícia","records":"Registro fictício","handoff":"Entrega fictícia","rules":"Exceção fictícia"}',
 'Quem confirma a entrega?','Proposta fictícia','Consolidação assistida; sem assinatura de área.','synthetic-batch',
 '{"base":{"nodeIds":["M01.A01","M01.A03"],"edges":[{"id":"editorial-edge","from":"M01.A01","to":"M01.A03","kind":"fluxo","label":"Entrega fictícia","basis":"Conferir passagem","source":"Fonte fictícia","inferred":true}],"positions":{},"labels":[]}}'
from public.process_feedback where nonce=pg_temp.f(30);
select pg_temp.ok((select count(*)=1 from public.process_editorial_revisions),'editorial import saved');
select pg_temp.ok((select source_author_name=(select full_name from public.profiles where id=pg_temp.f(2)) from public.process_editorial_revisions),'author derived from source');
select pg_temp.ok(exists(select 1 from public.audit_logs where entity_type='process_editorial_revisions' and actor_id is null),'system provenance is not a human signature');
select pg_temp.ok((select content->'activities'->0->>'account' is null from public.process_maps where id=pg_temp.f(22)),'snapshot remains unchanged');
select pg_temp.denied($sql$
 insert into public.process_editorial_revisions(map_id,map_version,item_id,source_feedback_id,decision,note,request_reference)
 values(pg_temp.f(23),1,'B01',(select id from public.process_feedback where nonce=pg_temp.f(30)),'needs_information','Pergunta fictícia pendente','cross-map')
$sql$,'22023','source map mismatch');
select pg_temp.denied($sql$
 insert into public.process_editorial_revisions(map_id,map_version,item_id,source_feedback_id,decision,note,request_reference)
 values(pg_temp.f(22),2,'M01.A01',(select id from public.process_feedback where nonce=pg_temp.f(30)),'needs_information','Pergunta fictícia pendente','wrong-version')
$sql$,'40001','wrong map version');
select pg_temp.denied($sql$
 insert into public.process_editorial_revisions(map_id,map_version,item_id,source_feedback_id,decision,details,note,request_reference)
 values(pg_temp.f(22),1,'M01.A01',(select id from public.process_feedback where nonce=pg_temp.f(30)),'accepted','{}','Texto incompleto fictício','empty-details')
$sql$,'22023','accepted needs five details');
select pg_temp.ok(not has_table_privilege('authenticated','public.process_editorial_revisions','INSERT'),'no member writes');
select pg_temp.ok(not has_table_privilege('service_role','public.process_editorial_revisions','UPDATE'),'no administrative history edits');
select pg_temp.ok(not has_table_privilege('anon','public.process_editorial_revisions','SELECT'),'no public narratives');
savepoint editorial_neighbor;
set local role authenticated;
select pg_temp.login(1);
select public.assign_process_area(pg_temp.f(22),'M01','Arquivo',pg_temp.f(2),true,(select mandate from public.process_area_assignments where map_id=pg_temp.f(22)));
select pg_temp.login(2);
select public.record_process_area(pg_temp.f(22),'M01.A03','revision',
 (select mandate from public.process_area_assignments where map_id=pg_temp.f(22)),0,'Rotina fictícia para conferência',
 '{"routine":"Rotina fictícia","owner":"Equipe fictícia","records":"Registro fictício","handoff":"Entrega fictícia","rules":"Exceção fictícia"}');
select public.record_process_area(pg_temp.f(22),'M01.A03','approved',
 (select mandate from public.process_area_assignments where map_id=pg_temp.f(22)),
 (select max(id) from public.process_area_events where map_id=pg_temp.f(22) and item_id='M01.A03'),'Conferência fictícia da área',null);
select public.record_process_area(pg_temp.f(22),'M01.A01','revision',
 (select mandate from public.process_area_assignments where map_id=pg_temp.f(22)),
 (select max(id) from public.process_area_events where map_id=pg_temp.f(22) and item_id='M01.A01'),'Revisão fictícia da origem',
 '{"routine":"Outra rotina fictícia","owner":"Equipe fictícia","records":"Registro fictício","handoff":"Outra entrega fictícia","rules":"Exceção fictícia"}');
select pg_temp.ok((select kind='reopen' from public.process_area_events where map_id=pg_temp.f(22) and item_id='M01.A03' order by id desc limit 1),'editorial handoff invalidates prior area approval');
reset role;
rollback to savepoint editorial_neighbor;
set local role authenticated;
select pg_temp.login(2);
select pg_temp.ok((select count(*)=1 from public.process_editorial_revisions),'author reads consolidation');
select pg_temp.login(3);
select pg_temp.ok((select count(*)=1 from public.process_editorial_revisions),'invited peer reads curated text');
select pg_temp.ok((select count(*)=0 from public.process_feedback_reviews),'private review stays private');
select pg_temp.login(5);
select pg_temp.ok((select count(*)=0 from public.process_editorial_revisions),'uninvited cannot read curated text');
select pg_temp.login(1);
update public.process_review_members set active=false,granted_by=pg_temp.f(1) where map_id=pg_temp.f(22) and profile_id=pg_temp.f(2);
select pg_temp.login(2);
select pg_temp.ok((select count(*)=0 from public.process_editorial_revisions),'revocation blocks editorial reads');
select pg_temp.login(1);
update public.process_review_members set active=true,granted_by=pg_temp.f(1) where map_id=pg_temp.f(22) and profile_id=pg_temp.f(2);
select pg_temp.login(3);
