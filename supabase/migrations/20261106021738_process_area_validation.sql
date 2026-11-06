-- Decisions belong to one immutable map and one designated hospital area.
create table public.process_area_assignments (
  map_id uuid not null references public.process_maps(id),
  macro_id text not null,
  area text not null check (length(trim(area)) between 2 and 90),
  assignee uuid not null references public.profiles(id),
  assignee_name text not null,
  mandate uuid not null default gen_random_uuid(),
  active boolean not null,
  primary key (map_id, macro_id, area)
);
create index process_area_assignments_person on public.process_area_assignments(assignee);

create table public.process_area_events (
  id bigint generated always as identity primary key,
  map_id uuid not null references public.process_maps(id),
  item_id text not null,
  kind text not null check (kind in ('revision','reopen','correction','approved')),
  actor uuid not null references public.profiles(id),
  actor_name text not null,
  area text,
  mandate uuid,
  details jsonb,
  note text not null check (length(note) between 5 and 2000),
  created_at timestamptz not null default clock_timestamp()
);
create index process_area_events_item on public.process_area_events(map_id,item_id,id desc);
create index process_area_events_actor on public.process_area_events(actor);
alter table public.process_area_assignments enable row level security;
alter table public.process_area_events enable row level security;
revoke all on public.process_area_assignments,public.process_area_events from public,anon,authenticated;
revoke all on sequence public.process_area_events_id_seq from public,anon,authenticated;
grant select on public.process_area_assignments,public.process_area_events to authenticated;
create policy area_assignments_read on public.process_area_assignments for select to authenticated
using ((select private.can_read_process_map(map_id)));
create policy area_events_read on public.process_area_events for select to authenticated
using ((select private.can_read_process_map(map_id)));

create function private.assign_process_area(p_map uuid,p_macro text,p_area text,p_person uuid,p_active boolean,p_expected uuid)
returns void language plpgsql security definer set search_path='' as $$
declare m public.process_maps; previous uuid; person_name text;
begin
  if auth.uid() is null or not private.can_manage_gip() then raise insufficient_privilege; end if;
  select * into strict m from public.process_maps where id=p_map for update;
  if m.status<>'open' or not exists(select from jsonb_array_elements(m.content->'macros') x where x->>'id'=p_macro) then raise invalid_parameter_value; end if;
  p_area:=trim(p_area);
  select mandate into previous from public.process_area_assignments where map_id=p_map and macro_id=p_macro and area=p_area;
  if previous is distinct from p_expected then raise serialization_failure; end if;
  if p_active then
    select p.full_name into person_name from public.profiles p
    join public.process_review_members r on r.profile_id=p.id and r.map_id=p_map
    where p.id=p_person and p.active and p.account_status='aprovado' and r.active and r.participation='reviewer' for share of r,p;
    if not found then raise insufficient_privilege; end if;
    insert into public.process_area_assignments(map_id,macro_id,area,assignee,assignee_name,active)
    values(p_map,p_macro,p_area,p_person,person_name,true)
    on conflict(map_id,macro_id,area) do update set assignee=excluded.assignee,assignee_name=excluded.assignee_name,active=true,mandate=gen_random_uuid();
  else
    update public.process_area_assignments set active=false,mandate=gen_random_uuid()
    where map_id=p_map and macro_id=p_macro and area=p_area and assignee=p_person;
    if not found then raise invalid_parameter_value; end if;
  end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'update','process_area_assignments',p_map::text,jsonb_build_object('macro',p_macro,'area',p_area,'person',p_person,'active',p_active));
end $$;

create function private.record_process_area(p_map uuid,p_item text,p_kind text,p_mandate uuid,p_expected bigint,p_note text,p_details jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare m public.process_maps; a jsonb; rep public.process_area_assignments; person_name text; last_id bigint; revision_id bigint; neighbor text; k text;
begin
  if auth.uid() is null or not private.can_submit_process_feedback(p_map) then raise insufficient_privilege; end if;
  select * into strict m from public.process_maps where id=p_map for update;
  if m.status<>'open' then raise insufficient_privilege; end if;
  select x into a from jsonb_array_elements(m.content->'activities') x where x->>'id'=p_item;
  if a is null or p_kind not in ('revision','approved','correction') then raise invalid_parameter_value; end if;
  select full_name into strict person_name from public.profiles where id=auth.uid() and account_status='aprovado' and active for share;
  if p_mandate is not null then
    select d.* into rep from public.process_area_assignments d
    join public.process_review_members r on r.map_id=d.map_id and r.profile_id=d.assignee
    where d.map_id=p_map and d.macro_id=a->>'macro' and d.active and d.mandate=p_mandate and d.assignee=auth.uid()
    and r.active and r.participation='reviewer' for share of r;
    if not found then raise insufficient_privilege; end if;
  elsif p_kind='approved' or not private.can_manage_gip() then raise insufficient_privilege;
  end if;
  select coalesce(max(id),0),coalesce(max(id) filter(where kind='revision'),0) into last_id,revision_id
  from public.process_area_events where map_id=p_map and item_id=p_item;
  if last_id is distinct from p_expected then raise serialization_failure; end if;
  if p_kind='revision' then
    if jsonb_typeof(p_details) is distinct from 'object' or octet_length(p_details::text)>30000 then raise invalid_parameter_value; end if;
    foreach k in array array['routine','owner','records','handoff','rules'] loop
      if jsonb_typeof(p_details->k) is distinct from 'string' or length(trim(p_details->>k)) not between 3 and 1800 then raise invalid_parameter_value; end if;
    end loop;
  elsif p_details is not null then raise invalid_parameter_value;
  elsif p_kind='approved' and (revision_id=0 or exists(select from public.process_area_events where map_id=p_map and item_id=p_item and kind='correction' and id>revision_id)) then
    raise exception 'Consolide os detalhes antes de confirmar.' using errcode='22023';
  end if;
  insert into public.process_area_events(map_id,item_id,kind,actor,actor_name,area,mandate,details,note)
  values(p_map,p_item,p_kind,auth.uid(),person_name,rep.area,rep.mandate,p_details,trim(p_note));
  if p_kind='revision' then
    -- Connected activities must check their handoffs again after a material revision.
    for neighbor in
      with edges as (
        select e from jsonb_each(coalesce(m.content#>'{flows,scoped}','{}')) f
        cross join lateral jsonb_array_elements(coalesce(f.value#>'{base,edges}','[]')||coalesce(f.value#>'{decisions,edges}','[]')) e
      ) select distinct x->>'id' from jsonb_array_elements(m.content->'activities') x
        join edges on ((e->>'from'=p_item and e->>'to'=x->>'id') or (e->>'to'=p_item and e->>'from'=x->>'id'))
        where x->>'id'<>p_item
    loop
      insert into public.process_area_events(map_id,item_id,kind,actor,actor_name,note)
      values(p_map,neighbor,'reopen',auth.uid(),person_name,'Conferir passagem após revisão de '||p_item);
    end loop;
  end if;
end $$;

create function public.assign_process_area(p_map uuid,p_macro text,p_area text,p_person uuid,p_active boolean,p_expected uuid)
returns void language sql security invoker set search_path='' as $$select private.assign_process_area(p_map,p_macro,p_area,p_person,p_active,p_expected)$$;
create function public.record_process_area(p_map uuid,p_item text,p_kind text,p_mandate uuid,p_expected bigint,p_note text,p_details jsonb)
returns void language sql security invoker set search_path='' as $$select private.record_process_area(p_map,p_item,p_kind,p_mandate,p_expected,p_note,p_details)$$;
revoke all on function private.assign_process_area(uuid,text,text,uuid,boolean,uuid),public.assign_process_area(uuid,text,text,uuid,boolean,uuid),
private.record_process_area(uuid,text,text,uuid,bigint,text,jsonb),public.record_process_area(uuid,text,text,uuid,bigint,text,jsonb) from public,anon;
grant execute on function private.assign_process_area(uuid,text,text,uuid,boolean,uuid),public.assign_process_area(uuid,text,text,uuid,boolean,uuid),
private.record_process_area(uuid,text,text,uuid,bigint,text,jsonb),public.record_process_area(uuid,text,text,uuid,bigint,text,jsonb) to authenticated;

