-- Assisted editorial consolidation is separate from human review and area signatures.
create table public.process_editorial_revisions (
 id bigint generated always as identity primary key,
 map_id uuid not null references public.process_maps(id),
 map_version integer not null check(map_version>0),
 item_id text not null,
 source_feedback_id uuid not null references public.process_feedback(id),
 source_author_name text not null default '',
 recorded_by text not null default 'gip_assistant' check(recorded_by='gip_assistant'),
 decision text not null check(decision in ('accepted','needs_information')),
 details jsonb,
 pending_question text not null default '' check(length(pending_question)<=2000),
 proposed_improvement text not null default '' check(length(proposed_improvement)<=3000),
 note text not null check(length(trim(note)) between 5 and 2000),
 request_reference text not null check(length(request_reference) between 5 and 120),
 diagram jsonb check(diagram is null or (jsonb_typeof(diagram)='object' and octet_length(diagram::text)<=65536)),
 created_at timestamptz not null default clock_timestamp(),
 unique(request_reference,source_feedback_id)
);
create index process_editorial_map_cursor on public.process_editorial_revisions(map_id,id);
create index process_editorial_source on public.process_editorial_revisions(source_feedback_id);
alter table public.process_editorial_revisions enable row level security;
revoke all on public.process_editorial_revisions from public,anon,authenticated,service_role;
revoke all on sequence public.process_editorial_revisions_id_seq from public,anon,authenticated,service_role;
grant select on public.process_editorial_revisions to authenticated,service_role;
grant insert on public.process_editorial_revisions to service_role;
grant usage,select on sequence public.process_editorial_revisions_id_seq to service_role;
create policy process_editorial_read on public.process_editorial_revisions for select to authenticated
 using ((select private.can_read_process_map(map_id)));
create function private.guard_process_editorial_revision() returns trigger
 language plpgsql security invoker set search_path='' as $$
declare f public.process_feedback; m public.process_maps; k text;
begin
 if tg_op<>'INSERT' then raise exception 'Editorial history is append-only' using errcode='42501';end if;
 select * into m from public.process_maps where id=new.map_id for update;
 if m.id is null or m.version<>new.map_version then
  raise exception 'Stale editorial map version' using errcode='40001';end if;
 select * into f from public.process_feedback where id=new.source_feedback_id;
 if f.id is null or f.map_id<>new.map_id or f.map_version<>new.map_version or f.item_id<>new.item_id
 or not exists(select 1 from jsonb_array_elements(m.content->'activities')a where a->>'id'=new.item_id)
 then raise exception 'Editorial source mismatch' using errcode='22023';end if;
 if new.decision='accepted' then
  if new.details is null or jsonb_typeof(new.details)<>'object' then
   raise exception 'Five editorial details required' using errcode='22023';end if;
  foreach k in array array['routine','owner','records','handoff','rules'] loop
   if jsonb_typeof(new.details->k) is distinct from 'string' or length(trim(new.details->>k)) not between 3 and 1800 then
    raise exception 'Invalid editorial detail: %',k using errcode='22023';end if;
  end loop;
 elsif new.details is not null or new.diagram is not null then
  raise exception 'Unresolved feedback cannot replace the routine or diagram' using errcode='22023';
 end if;
 select coalesce(full_name,'Participante') into new.source_author_name from public.profiles where id=f.author_id;
 new.recorded_by='gip_assistant';
 new.created_at=clock_timestamp();
 return new;
end $$;
create trigger process_editorial_guard before insert or update or delete on public.process_editorial_revisions
 for each row execute function private.guard_process_editorial_revision();
create function private.audit_process_editorial_revision() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'editorial_consolidation','process_editorial_revisions',new.id::text,
 jsonb_build_object('map_id',new.map_id,'item_id',new.item_id,'source_feedback_id',new.source_feedback_id,
 'decision',new.decision,'recorded_by',new.recorded_by,'request_reference',new.request_reference));
 return new;
end $$;
create trigger process_editorial_audit after insert on public.process_editorial_revisions
 for each row execute function private.audit_process_editorial_revision();
revoke all on function private.guard_process_editorial_revision(),private.audit_process_editorial_revision() from public,anon,authenticated;
comment on table public.process_editorial_revisions is 'Assisted editorial decisions, not institutional approvals. Original comments and snapshots remain immutable.';
