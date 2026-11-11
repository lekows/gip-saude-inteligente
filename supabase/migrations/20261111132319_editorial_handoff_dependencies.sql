-- Keep formal handoff invalidation consistent with editorial diagram overlays.
CREATE OR REPLACE FUNCTION private.record_process_area(p_map uuid, p_item text, p_kind text, p_mandate uuid, p_expected bigint, p_note text, p_details jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
        union all
        -- Retain historical editorial dependencies conservatively, so no reviewed handoff is missed.
        select edge from public.process_editorial_revisions r
        cross join lateral jsonb_each(coalesce(r.diagram,'{}')) flow
        cross join lateral jsonb_array_elements(
          case when jsonb_typeof(flow.value->'edges')='array' then flow.value->'edges' else '[]'::jsonb end
        ) edge
        where r.map_id=p_map and r.map_version=m.version and r.decision='accepted'
      ) select distinct x->>'id' from jsonb_array_elements(m.content->'activities') x
        join edges on ((e->>'from'=p_item and e->>'to'=x->>'id') or (e->>'to'=p_item and e->>'from'=x->>'id'))
        where x->>'id'<>p_item
    loop
      insert into public.process_area_events(map_id,item_id,kind,actor,actor_name,note)
      values(p_map,neighbor,'reopen',auth.uid(),person_name,'Conferir passagem após revisão de '||p_item);
    end loop;
  end if;
end $function$
;
