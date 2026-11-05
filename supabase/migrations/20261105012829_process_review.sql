-- First release: immutable process maps and scoped, attributed student feedback.
create table public.process_maps (
  id uuid primary key default gen_random_uuid(),
  health_unit_id uuid not null references public.health_units(id) on delete restrict,
  title text not null check (length(trim(title)) between 5 and 200),
  version integer not null default 1 check (version > 0),
  status text not null default 'open' check (status in ('open','closed')),
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 500000),
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(health_unit_id,version)
);
create table public.process_review_members (
  map_id uuid not null references public.process_maps(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  participation text not null default 'reviewer' check (participation in ('viewer','reviewer')),
  active boolean not null default true,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  primary key(map_id,profile_id)
);
create table public.process_feedback (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.process_maps(id) on delete restrict,
  map_version integer not null check (map_version > 0),
  author_id uuid not null references public.profiles(id) on delete restrict,
  nonce uuid not null,
  item_id text not null check (length(item_id) between 1 and 100),
  kind text not null check (kind in ('understood','question','change','new_step')),
  message text not null check (length(trim(message)) between 10 and 3000),
  proposal text not null default '' check (length(proposal) <= 2000),
  created_at timestamptz not null default clock_timestamp(),
  unique(author_id,nonce)
);
create table public.process_feedback_reviews (
  id bigint generated always as identity primary key,
  feedback_id uuid not null references public.process_feedback(id) on delete restrict,
  revision integer not null check (revision > 0),
  decision text not null check (decision in ('accepted','declined','needs_information')),
  message text not null check (length(trim(message)) between 5 and 2000),
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  unique(feedback_id,revision)
);
create index process_maps_unit_idx on public.process_maps(health_unit_id);
create index process_maps_creator_idx on public.process_maps(created_by);
create index process_review_members_profile_idx on public.process_review_members(profile_id,map_id) where active;
create index process_review_members_grantor_idx on public.process_review_members(granted_by);
create index process_feedback_map_time_idx on public.process_feedback(map_id,created_at desc);
create index process_feedback_author_time_idx on public.process_feedback(author_id,created_at desc);
create index process_feedback_reviews_reviewer_idx on public.process_feedback_reviews(reviewer_id);

alter table public.process_maps enable row level security;
alter table public.process_review_members enable row level security;
alter table public.process_feedback enable row level security;
alter table public.process_feedback_reviews enable row level security;
revoke all on public.process_maps,public.process_review_members,public.process_feedback,public.process_feedback_reviews from public,anon,authenticated;
revoke all on sequence public.process_feedback_reviews_id_seq from public,anon,authenticated;
grant select on public.process_maps,public.process_review_members,public.process_feedback,public.process_feedback_reviews to authenticated;
grant update(status) on public.process_maps to authenticated;
grant insert,update on public.process_review_members to authenticated;
grant insert on public.process_feedback,public.process_feedback_reviews to authenticated;
grant usage on sequence public.process_feedback_reviews_id_seq to authenticated;

-- Private, narrowly scoped lookup prevents recursive policies on memberships.
-- Approved status is checked live; JWT user_metadata is never authoritative.
create function private.can_read_process_map(p_map_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and private.is_approved_user() and (
   private.can_manage_gip() or exists (
     select 1 from public.process_review_members m
     where m.map_id=p_map_id and m.profile_id=auth.uid() and m.active
   )
 );
$$;
create function private.can_submit_process_feedback(p_map_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and private.is_approved_user()
 and exists (select 1 from public.process_maps p where p.id=p_map_id and p.status='open')
 and (private.can_manage_gip() or exists (
   select 1 from public.process_review_members m
   where m.map_id=p_map_id and m.profile_id=auth.uid() and m.active and m.participation='reviewer'
 ));
$$;
revoke all on function private.can_read_process_map(uuid),private.can_submit_process_feedback(uuid) from public,anon;
grant execute on function private.can_read_process_map(uuid),private.can_submit_process_feedback(uuid) to authenticated;

create policy process_maps_read on public.process_maps for select to authenticated
using ((select private.can_read_process_map(id)));
create policy process_maps_close on public.process_maps for update to authenticated
using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()));
create policy process_members_read on public.process_review_members for select to authenticated
using ((select private.is_approved_user()) and (profile_id=(select auth.uid()) or (select private.can_manage_gip())));
create policy process_members_insert on public.process_review_members for insert to authenticated
with check ((select private.can_manage_gip()) and granted_by=(select auth.uid()));
create policy process_members_update on public.process_review_members for update to authenticated
using ((select private.can_manage_gip())) with check ((select private.can_manage_gip()) and granted_by=(select auth.uid()));
create policy process_feedback_read on public.process_feedback for select to authenticated
using ((select private.can_read_process_map(map_id)) and (author_id=(select auth.uid()) or (select private.can_manage_gip())));
create policy process_feedback_insert on public.process_feedback for insert to authenticated
with check ((select private.can_submit_process_feedback(map_id)) and author_id=(select auth.uid()));
create policy process_feedback_reviews_read on public.process_feedback_reviews for select to authenticated
using (exists(select 1 from public.process_feedback f where f.id=feedback_id));
create policy process_feedback_reviews_insert on public.process_feedback_reviews for insert to authenticated
with check ((select private.can_manage_gip()) and reviewer_id=(select auth.uid()));

create function private.process_item_exists(p_content jsonb,p_item text)
returns boolean language sql immutable security invoker set search_path = '' as $$
 select p_item='__map__' or exists (
   select 1 from (
     select x->>'id' as id from jsonb_array_elements(coalesce(p_content->'macros','[]'::jsonb)) x
     union all select x->>'id' from jsonb_array_elements(coalesce(p_content->'activities','[]'::jsonb)) x
     union all select x->>'id' from jsonb_array_elements(coalesce(p_content->'questions','[]'::jsonb)) x
     union all select x->>'id' from jsonb_array_elements(coalesce(p_content->'systems','[]'::jsonb)) x
     union all select x->>'id' from jsonb_array_elements(coalesce(p_content->'sources','[]'::jsonb)) x
     union all select x->>'id' from jsonb_array_elements(coalesce(p_content->'decisionNodes','[]'::jsonb)) x
     union all select 'R.'||(x->>'id') from jsonb_array_elements(coalesce(p_content->'activities','[]'::jsonb)) x
     union all select 'P.'||(x->>'id') from jsonb_array_elements(coalesce(p_content->'activities','[]'::jsonb)) x
   ) items where items.id=p_item
 );
$$;
revoke all on function private.process_item_exists(jsonb,text) from public,anon;
grant execute on function private.process_item_exists(jsonb,text) to authenticated;

create function private.guard_process_membership()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if not private.can_manage_gip() or new.granted_by is distinct from auth.uid() then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
 if tg_op='UPDATE' and (new.map_id<>old.map_id or new.profile_id<>old.profile_id) then raise exception 'O vínculo não pode ser transferido.' using errcode='22023'; end if;
 if new.active and not exists(select 1 from public.profiles p where p.id=new.profile_id and p.active and p.account_status='aprovado') then
   raise exception 'Selecione uma conta aprovada e ativa.' using errcode='22023';
 end if;
 new.granted_at=clock_timestamp();
 return new;
end;
$$;
create trigger process_membership_guard before insert or update on public.process_review_members
for each row execute function private.guard_process_membership();

create function private.guard_process_feedback()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_content jsonb; v_version integer;
begin
 if new.author_id is distinct from auth.uid() or not private.can_submit_process_feedback(new.map_id) then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('process-feedback:'||auth.uid()::text,0));
 select content,version into v_content,v_version from public.process_maps where id=new.map_id;
 if new.map_version is distinct from v_version then raise exception 'A versão do mapa mudou. Atualize a página.' using errcode='40001'; end if;
 if not private.process_item_exists(v_content,new.item_id) then raise exception 'Etapa desconhecida nesta versão.' using errcode='22023'; end if;
 if new.kind in ('change','new_step') and length(trim(new.proposal))<10 then raise exception 'Descreva a mudança proposta.' using errcode='22023'; end if;
 if (select count(*) from public.process_feedback where author_id=auth.uid() and created_at>clock_timestamp()-interval '1 hour')>=30 then
   raise exception 'Limite de contribuições atingido. Tente novamente mais tarde.' using errcode='54000';
 end if;
 new.created_at=clock_timestamp();
 return new;
end;
$$;
create trigger process_feedback_guard before insert on public.process_feedback
for each row execute function private.guard_process_feedback();

create function private.guard_process_feedback_review()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_revision integer;
begin
 if new.reviewer_id is distinct from auth.uid() or not private.can_manage_gip() then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('process-review:'||new.feedback_id::text,0));
 select coalesce(max(revision),0) into v_revision from public.process_feedback_reviews where feedback_id=new.feedback_id;
 if new.revision is distinct from v_revision+1 then raise exception 'Outra análise foi registrada. Atualize a página.' using errcode='40001'; end if;
 new.created_at=clock_timestamp();
 return new;
end;
$$;
create trigger process_feedback_review_guard before insert on public.process_feedback_reviews
for each row execute function private.guard_process_feedback_review();

create function private.audit_process_review_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_id text; v_metadata jsonb;
begin
 if tg_table_name='process_review_members' then
   v_id=new.map_id::text||':'||new.profile_id::text;
   v_metadata=jsonb_build_object('map_id',new.map_id,'profile_id',new.profile_id,'active',new.active,'participation',new.participation);
 elsif tg_table_name='process_feedback' then
   v_id=new.id::text;v_metadata=jsonb_build_object('map_id',new.map_id,'item_id',new.item_id,'version',new.map_version,'kind',new.kind);
 elsif tg_table_name='process_feedback_reviews' then
   v_id=new.feedback_id::text;v_metadata=jsonb_build_object('revision',new.revision,'decision',new.decision);
 else
   v_id=new.id::text;v_metadata=jsonb_build_object('status',new.status,'version',new.version);
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),lower(tg_op),tg_table_name,v_id,v_metadata);
 return new;
end;
$$;
create trigger process_membership_audit after insert or update on public.process_review_members for each row execute function private.audit_process_review_change();
create trigger process_feedback_audit after insert on public.process_feedback for each row execute function private.audit_process_review_change();
create trigger process_feedback_review_audit after insert on public.process_feedback_reviews for each row execute function private.audit_process_review_change();
create trigger process_map_status_audit after update of status on public.process_maps for each row execute function private.audit_process_review_change();
revoke all on function private.guard_process_membership(),private.guard_process_feedback(),private.guard_process_feedback_review(),private.audit_process_review_change() from public,anon,authenticated;

create function public.submit_process_feedback(p_map_id uuid,p_map_version integer,p_nonce uuid,p_item_id text,p_kind text,p_message text,p_proposal text default '')
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_existing public.process_feedback%rowtype; v_id uuid;
begin
 if not private.can_submit_process_feedback(p_map_id) then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('process-feedback:'||auth.uid()::text,0));
 select * into v_existing from public.process_feedback where author_id=auth.uid() and nonce=p_nonce;
 if found then
   if (v_existing.map_id,v_existing.map_version,v_existing.item_id,v_existing.kind,v_existing.message,v_existing.proposal)
      is distinct from (p_map_id,p_map_version,p_item_id,p_kind,trim(p_message),trim(p_proposal)) then
     raise exception 'Identificador já utilizado em outra contribuição.' using errcode='22023';
   end if;
   return v_existing.id;
 end if;
 insert into public.process_feedback(map_id,map_version,author_id,nonce,item_id,kind,message,proposal)
 values(p_map_id,p_map_version,auth.uid(),p_nonce,p_item_id,p_kind,trim(p_message),trim(p_proposal)) returning id into v_id;
 return v_id;
end;
$$;
revoke all on function public.submit_process_feedback(uuid,integer,uuid,text,text,text,text) from public,anon;
grant execute on function public.submit_process_feedback(uuid,integer,uuid,text,text,text,text) to authenticated;

comment on table public.process_maps is 'Immutable content snapshots for scoped educational process review; not patient records or institutional approval.';
comment on table public.process_feedback is 'Attributed, append-only contributions. Understanding by a student is not approval of the operational process.';
comment on table public.process_feedback_reviews is 'Append-only coordination replies. Accepted means considered for a future revision, not applied to the map.';

