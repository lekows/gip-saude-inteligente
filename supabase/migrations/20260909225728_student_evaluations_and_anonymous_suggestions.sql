-- Student learning records and separately stored anonymous program feedback.
-- Identified writes use atomic RPCs so revision history cannot be forged.
-- Anonymous submissions intentionally contain no author, session, IP or exact time.
-- Hosting/API logging and retention still need institutional privacy review.

create table public.evaluation_campaigns (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.program_cycles(id) on delete restrict,
  class_id uuid references public.training_classes(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 3 and 180),
  kind text not null check (kind in ('self', 'program')),
  stage text not null check (stage in ('initial', 'module', 'final')),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  version integer not null default 1 check (version = 1),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at > opens_at)
);

create table public.evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.evaluation_campaigns(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  revision integer not null default 1 check (revision > 0),
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (campaign_id, profile_id),
  check ((status = 'submitted') = (submitted_at is not null))
);

create table public.evaluation_response_versions (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.evaluation_responses(id) on delete restrict,
  revision integer not null check (revision > 0),
  answers jsonb not null,
  submitted_at timestamptz not null,
  unique (response_id, revision)
);

create table public.evaluation_feedback (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.evaluation_responses(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  message text not null check (char_length(btrim(message)) between 3 and 3000),
  created_at timestamptz not null default now()
);

create table public.anonymous_program_responses (
  id uuid primary key default gen_random_uuid(),
  nonce uuid not null unique,
  campaign_id uuid not null references public.evaluation_campaigns(id) on delete restrict,
  answers jsonb not null
);

create table public.anonymous_suggestions (
  id uuid primary key default gen_random_uuid(),
  nonce uuid not null unique,
  category text not null check (category in ('aulas', 'comunicacao', 'organizacao', 'materiais', 'campo', 'site', 'outro')),
  message text not null check (char_length(btrim(message)) between 10 and 3000),
  proposal text check (proposal is null or char_length(proposal) <= 1500),
  submitted_month date not null default date_trunc('month', now() at time zone 'America/Sao_Paulo')::date,
  status text not null default 'received' check (status in ('received', 'reviewing', 'planned', 'implemented', 'declined')),
  resolution_summary text check (resolution_summary is null or char_length(resolution_summary) <= 2000),
  owner_label text check (owner_label is null or char_length(owner_label) <= 120),
  due_date date,
  published boolean not null default false,
  check (submitted_month = date_trunc('month', submitted_month::timestamp)::date)
);

-- A physically separate table prevents raw suggestion text leaking through
-- alternative SELECT column lists, filtering, joins or generated APIs.
create table public.suggestion_publications (
  id uuid primary key references public.anonymous_suggestions(id) on delete restrict,
  category text not null,
  summary text not null check (char_length(btrim(summary)) between 10 and 1000),
  status text not null check (status in ('reviewing', 'planned', 'implemented', 'declined')),
  resolution_summary text not null check (char_length(btrim(resolution_summary)) between 3 and 2000),
  owner_label text,
  due_date date,
  published_month date not null
);

create index evaluation_campaigns_cycle_idx on public.evaluation_campaigns(cycle_id);
create index evaluation_campaigns_class_idx on public.evaluation_campaigns(class_id);
create index evaluation_campaigns_creator_idx on public.evaluation_campaigns(created_by);
create index evaluation_responses_profile_idx on public.evaluation_responses(profile_id);
create index evaluation_feedback_response_idx on public.evaluation_feedback(response_id);
create index evaluation_feedback_author_idx on public.evaluation_feedback(author_id);
create index anonymous_program_responses_campaign_idx on public.anonymous_program_responses(campaign_id);

create function private.is_evaluation_manager()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
      and p.active and p.account_status = 'aprovado'
      and p.role in ('administrador', 'professor_coordenador')
  );
$$;

create function private.can_review_evaluation(p_campaign_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    private.is_evaluation_manager() or exists (
      select 1 from public.evaluation_campaigns c
      join public.training_classes tc on tc.id = c.class_id
      join public.profiles p on p.id = (select auth.uid())
      where c.id = p_campaign_id and c.kind = 'self' and tc.instructor_id = p.id
        and p.active and p.account_status = 'aprovado'
        and p.role = 'professor_colaborador'
    )
  );
$$;

create function private.can_participate_evaluation(p_campaign_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.evaluation_campaigns c
    join public.program_members pm on pm.cycle_id = c.cycle_id
    join public.profiles p on p.id = pm.profile_id
    join public.program_cycles pc on pc.id = c.cycle_id
    where c.id = p_campaign_id and p.id = (select auth.uid())
      and p.active and p.account_status = 'aprovado'
      and p.role in ('academico_colaborador', 'academico_participante')
      and pm.status = 'ativo' and pc.status <> 'cancelado'
      and (pm.left_at is null or pm.left_at >= current_date)
      and (c.class_id is null or exists (
        select 1 from public.training_enrollments te
        join public.training_classes tc on tc.id = te.class_id
        where te.class_id = c.class_id and te.member_id = pm.id
          and te.status <> 'cancelado' and tc.status <> 'cancelada'
      ))
  );
$$;

create function private.can_read_evaluation_campaign(p_campaign_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_approved_user() and (
    private.can_review_evaluation(p_campaign_id)
    or exists (select 1 from public.evaluation_responses r
      where r.campaign_id = p_campaign_id and r.profile_id = (select auth.uid()))
    or (private.can_participate_evaluation(p_campaign_id)
      and exists (select 1 from public.evaluation_campaigns c
        where c.id = p_campaign_id and c.status <> 'draft'))
  );
$$;

create function private.can_read_evaluation_response(p_response_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_approved_user() and exists (
    select 1 from public.evaluation_responses r where r.id = p_response_id
      and (r.profile_id = (select auth.uid())
        or (r.status = 'submitted' and private.can_review_evaluation(r.campaign_id)))
  );
$$;

create function private.valid_evaluation_answers(p_kind text, p_answers jsonb, p_complete boolean)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare
  v_ratings text[];
  v_texts text[] := array[]::text[];
  v_key text;
  v_value jsonb;
begin
  if p_kind is null or p_kind not in ('self', 'program')
     or p_answers is null or jsonb_typeof(p_answers) <> 'object'
     or octet_length(p_answers::text) > 20000 then return false; end if;
  if p_kind = 'self' then
    v_ratings := array['comprehension', 'confidence', 'participation', 'communication', 'application'];
    v_texts := array['learning', 'difficulties', 'support', 'next_step'];
  else
    v_ratings := array['organization', 'content', 'mentoring', 'practice', 'infrastructure', 'satisfaction'];
  end if;
  for v_key, v_value in select key, value from jsonb_each(p_answers) loop
    if v_key = any(v_ratings) then
      if v_value <> 'null'::jsonb and (
        jsonb_typeof(v_value) <> 'number' or v_value::text not in ('1', '2', '3', '4', '5')
      ) then return false; end if;
    elsif v_key = any(v_texts) then
      if jsonb_typeof(v_value) <> 'string' or char_length(p_answers ->> v_key) > 1500 then return false; end if;
    else return false;
    end if;
  end loop;
  if p_complete and not (p_answers ?& (v_ratings || v_texts)) then return false; end if;
  return true;
end;
$$;

create function private.guard_evaluation_campaign()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_evaluation_manager() then raise exception 'Acesso nao autorizado.' using errcode = '42501'; end if;
  if new.class_id is not null and not exists (
    select 1 from public.training_classes c where c.id = new.class_id and c.cycle_id = new.cycle_id
  ) then raise exception 'A turma deve pertencer ao ciclo.' using errcode = '23514'; end if;
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    if new.created_by <> old.created_by or new.created_at <> old.created_at or new.id <> old.id then
      raise exception 'Identificacao da campanha imutavel.' using errcode = '23514';
    end if;
    if old.kind = 'program' and old.status = 'closed' then
      raise exception 'Avaliacao anonima encerrada e imutavel.' using errcode = '23514';
    end if;
    if old.status <> 'draft' and (
      new.kind <> old.kind or new.stage <> old.stage or new.version <> old.version
      or new.cycle_id <> old.cycle_id or new.class_id is distinct from old.class_id or new.status = 'draft'
    ) then raise exception 'Escopo de campanha publicada e imutavel.' using errcode = '23514'; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_evaluation_campaign before insert or update on public.evaluation_campaigns
for each row execute function private.guard_evaluation_campaign();

-- These private definer routines are needed for atomic writes across otherwise
-- read-only tables and for aggregating a table that no client can SELECT.
-- Each validates the current database profile, never user-editable JWT metadata.
create function private.save_evaluation_response(p_campaign_id uuid, p_answers jsonb, p_submit boolean, p_expected_revision integer default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_campaign public.evaluation_campaigns; v_response public.evaluation_responses; v_id uuid;
begin
  if auth.uid() is null or not private.can_participate_evaluation(p_campaign_id) then
    raise exception 'Participacao nao autorizada.' using errcode = '42501'; end if;
  select * into v_campaign from public.evaluation_campaigns where id = p_campaign_id for share;
  if v_campaign.kind <> 'self' or v_campaign.status <> 'open'
    or now() < v_campaign.opens_at or now() >= v_campaign.closes_at then
    raise exception 'Avaliacao fora do periodo de preenchimento.' using errcode = '23514'; end if;
  if p_submit is null or not private.valid_evaluation_answers('self', p_answers, p_submit) then
    raise exception 'Respostas invalidas.' using errcode = '23514'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_campaign_id::text || ':' || auth.uid()::text, 0));
  select * into v_response from public.evaluation_responses
    where campaign_id = p_campaign_id and profile_id = auth.uid() for update;
  if found then
    if v_response.status = 'submitted' then
      if p_submit and p_answers = v_response.answers then return v_response.id; end if;
      raise exception 'Avaliacao enviada; solicite reabertura a coordenacao.' using errcode = '23514';
    end if;
    if p_expected_revision is distinct from v_response.revision then
      raise exception 'Avaliacao alterada em outra aba. Atualize antes de salvar.' using errcode = '40001'; end if;
    update public.evaluation_responses set answers = p_answers,
      status = case when p_submit then 'submitted' else 'draft' end,
      revision = revision + 1, submitted_at = case when p_submit then now() else null end, updated_at = now()
      where id = v_response.id returning id into v_id;
  else
    if p_expected_revision is not null and p_expected_revision <> 0 then
      raise exception 'Versao anterior nao encontrada. Atualize a pagina.' using errcode = '40001'; end if;
    insert into public.evaluation_responses(campaign_id, profile_id, answers, status, submitted_at)
      values (p_campaign_id, auth.uid(), p_answers, case when p_submit then 'submitted' else 'draft' end,
        case when p_submit then now() else null end) returning id into v_id;
  end if;
  if p_submit then
    insert into public.evaluation_response_versions(response_id, revision, answers, submitted_at)
      select id, revision, answers, submitted_at from public.evaluation_responses where id = v_id;
  end if;
  return v_id;
end;
$$;

create function private.reopen_evaluation_response(p_response_id uuid, p_reason text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_response public.evaluation_responses; v_campaign public.evaluation_campaigns;
begin
  if auth.uid() is null or not private.is_evaluation_manager() then
    raise exception 'Acesso nao autorizado.' using errcode = '42501'; end if;
  if p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then
    raise exception 'Informe a justificativa de reabertura (10 a 500 caracteres).' using errcode = '23514'; end if;
  select * into v_response from public.evaluation_responses where id = p_response_id for update;
  if not found or v_response.status <> 'submitted' then
    raise exception 'Avaliacao enviada nao encontrada.' using errcode = '23514'; end if;
  select * into v_campaign from public.evaluation_campaigns where id = v_response.campaign_id for share;
  if v_campaign.kind <> 'self' or v_campaign.status <> 'open'
    or now() < v_campaign.opens_at or now() >= v_campaign.closes_at then
    raise exception 'Abra a campanha e ajuste o prazo antes de reabrir a resposta.' using errcode = '23514'; end if;
  update public.evaluation_responses set status = 'draft', submitted_at = null,
    revision = revision + 1, updated_at = now() where id = p_response_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'reopen_evaluation', 'evaluation_response', p_response_id::text,
      jsonb_build_object('reason', btrim(p_reason), 'previous_revision', v_response.revision));
  return true;
end;
$$;

create function private.add_evaluation_feedback(p_response_id uuid, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_response public.evaluation_responses; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticacao necessaria.' using errcode = '42501'; end if;
  select * into v_response from public.evaluation_responses where id = p_response_id for share;
  if not found or not private.can_review_evaluation(v_response.campaign_id) then
    raise exception 'Acesso nao autorizado.' using errcode = '42501'; end if;
  if v_response.status <> 'submitted' then
    raise exception 'Envie a avaliacao antes da devolutiva.' using errcode = '23514'; end if;
  insert into public.evaluation_feedback(response_id, author_id, message)
    values (p_response_id, auth.uid(), btrim(p_message)) returning id into v_id;
  return v_id;
end;
$$;

create function private.submit_anonymous_program_evaluation(p_campaign_id uuid, p_answers jsonb, p_nonce uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_campaign public.evaluation_campaigns;
begin
  if auth.uid() is null or not private.can_participate_evaluation(p_campaign_id) then
    raise exception 'Participacao nao autorizada.' using errcode = '42501'; end if;
  select * into v_campaign from public.evaluation_campaigns where id = p_campaign_id for share;
  if v_campaign.kind <> 'program' or v_campaign.status <> 'open'
    or now() < v_campaign.opens_at or now() >= v_campaign.closes_at then
    raise exception 'Avaliacao fora do periodo de preenchimento.' using errcode = '23514'; end if;
  if p_nonce is null or not private.valid_evaluation_answers('program', p_answers, true) then
    raise exception 'Respostas invalidas.' using errcode = '23514'; end if;
  insert into public.anonymous_program_responses(nonce, campaign_id, answers)
    values (p_nonce, p_campaign_id, p_answers) on conflict (nonce) do nothing;
  return true;
end;
$$;

create function private.submit_anonymous_suggestion(p_category text, p_message text, p_proposal text, p_nonce uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_approved_user() or not exists (
    select 1 from public.program_members pm join public.program_cycles pc on pc.id = pm.cycle_id
    join public.profiles p on p.id = pm.profile_id
    where pm.profile_id = auth.uid() and pm.status = 'ativo' and pc.status <> 'cancelado'
      and (pm.left_at is null or pm.left_at >= current_date)
      and p.role in ('academico_colaborador', 'academico_participante')
  ) then raise exception 'Participacao nao autorizada.' using errcode = '42501'; end if;
  if p_nonce is null then raise exception 'Identificador de envio necessario.' using errcode = '23514'; end if;
  insert into public.anonymous_suggestions(nonce, category, message, proposal)
    values (p_nonce, p_category, btrim(p_message), nullif(btrim(p_proposal), '')) on conflict (nonce) do nothing;
  return true;
end;
$$;

create function private.review_anonymous_suggestion(p_suggestion_id uuid, p_status text, p_resolution_summary text,
  p_owner_label text, p_due_date date, p_publish boolean, p_public_summary text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_suggestion public.anonymous_suggestions;
begin
  if auth.uid() is null or not private.is_evaluation_manager() then
    raise exception 'Acesso nao autorizado.' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('received', 'reviewing', 'planned', 'implemented', 'declined') or p_publish is null then
    raise exception 'Situacao invalida.' using errcode = '23514'; end if;
  if (p_publish or p_status in ('implemented', 'declined')) and
    (p_resolution_summary is null or char_length(btrim(p_resolution_summary)) < 3) then
    raise exception 'Informe a devolutiva revisada.' using errcode = '23514'; end if;
  if p_publish and (p_status = 'received' or p_public_summary is null or char_length(btrim(p_public_summary)) not between 10 and 1000) then
    raise exception 'Revise a sugestao e escreva uma sintese antes de publicar.' using errcode = '23514'; end if;
  select * into v_suggestion from public.anonymous_suggestions where id = p_suggestion_id for update;
  if not found then raise exception 'Sugestao nao encontrada.' using errcode = '23514'; end if;
  update public.anonymous_suggestions set status = p_status, resolution_summary = nullif(btrim(p_resolution_summary), ''),
    owner_label = nullif(btrim(p_owner_label), ''), due_date = p_due_date, published = p_publish where id = p_suggestion_id;
  if p_publish then
    insert into public.suggestion_publications(id, category, summary, status, resolution_summary, owner_label, due_date, published_month)
      values (p_suggestion_id, v_suggestion.category, btrim(p_public_summary), p_status, btrim(p_resolution_summary),
        nullif(btrim(p_owner_label), ''), p_due_date, date_trunc('month', now() at time zone 'America/Sao_Paulo')::date)
      on conflict (id) do update set summary = excluded.summary, status = excluded.status,
        resolution_summary = excluded.resolution_summary, owner_label = excluded.owner_label, due_date = excluded.due_date;
  else
    delete from public.suggestion_publications where id = p_suggestion_id;
  end if;
  -- Reviewer audit deliberately excludes raw suggestion/author information.
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'review_suggestion', 'anonymous_suggestion', p_suggestion_id::text,
      jsonb_build_object('status', p_status, 'published', p_publish));
  return true;
end;
$$;

create function private.get_program_evaluation_summary(p_campaign_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_count bigint; v_ratings jsonb;
begin
  if auth.uid() is null or not private.can_review_evaluation(p_campaign_id) then
    raise exception 'Acesso nao autorizado.' using errcode = '42501'; end if;
  if not exists (select 1 from public.evaluation_campaigns where id = p_campaign_id and kind = 'program' and status = 'closed') then
    return jsonb_build_object('available', false); end if;
  select count(*) into v_count from public.anonymous_program_responses where campaign_id = p_campaign_id;
  if v_count < 5 then return jsonb_build_object('available', false); end if;
  select jsonb_object_agg(q.key, case when q.valid_count >= 5
    then jsonb_build_object('count', q.valid_count, 'average', round(q.average, 2)) else 'null'::jsonb end)
    into v_ratings from (
      select a.key, count(nullif(a.value, 'null'::jsonb)) as valid_count,
        avg(case when a.value <> 'null'::jsonb then a.value::text::numeric end) as average
      from public.anonymous_program_responses r cross join lateral jsonb_each(r.answers) a
      where r.campaign_id = p_campaign_id group by a.key
    ) q;
  return jsonb_build_object('available', true, 'response_count', v_count, 'ratings', v_ratings);
end;
$$;

create function private.get_evaluation_roster(p_campaign_id uuid)
returns table (profile_id uuid, full_name text, status text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.can_review_evaluation(p_campaign_id)
    or not exists (select 1 from public.evaluation_campaigns c where c.id = p_campaign_id and c.kind = 'self') then
    raise exception 'Acesso nao autorizado.' using errcode = '42501'; end if;
  return query select p.id, p.full_name, coalesce(r.status, 'pending')
    from public.evaluation_campaigns c
    join public.program_cycles pc on pc.id = c.cycle_id
    join public.program_members pm on pm.cycle_id = c.cycle_id
    join public.profiles p on p.id = pm.profile_id
    left join public.evaluation_responses r on r.campaign_id = c.id and r.profile_id = p.id
    where c.id = p_campaign_id and pm.status = 'ativo' and pc.status <> 'cancelado'
      and p.active and p.account_status = 'aprovado'
      and p.role in ('academico_colaborador', 'academico_participante')
      and (pm.left_at is null or pm.left_at >= current_date)
      and (c.class_id is null or exists (
        select 1 from public.training_enrollments te
        join public.training_classes tc on tc.id = te.class_id
        where te.member_id = pm.id and te.class_id = c.class_id
          and te.status <> 'cancelado' and tc.status <> 'cancelada'
      )) order by p.full_name, p.id;
end;
$$;

alter table public.evaluation_campaigns enable row level security;
alter table public.evaluation_responses enable row level security;
alter table public.evaluation_response_versions enable row level security;
alter table public.evaluation_feedback enable row level security;
alter table public.anonymous_program_responses enable row level security;
alter table public.anonymous_suggestions enable row level security;
alter table public.suggestion_publications enable row level security;

create policy evaluation_campaigns_read on public.evaluation_campaigns for select to authenticated
  using (private.can_read_evaluation_campaign(id));
create policy evaluation_campaigns_insert on public.evaluation_campaigns for insert to authenticated
  with check ((select private.is_evaluation_manager()) and created_by = (select auth.uid()));
create policy evaluation_campaigns_update on public.evaluation_campaigns for update to authenticated
  using ((select private.is_evaluation_manager())) with check ((select private.is_evaluation_manager()));
create policy evaluation_responses_read on public.evaluation_responses for select to authenticated
  using (private.can_read_evaluation_response(id));
create policy evaluation_versions_read on public.evaluation_response_versions for select to authenticated
  using (private.can_read_evaluation_response(response_id));
create policy evaluation_feedback_read on public.evaluation_feedback for select to authenticated
  using (private.can_read_evaluation_response(response_id));
create policy anonymous_suggestions_review on public.anonymous_suggestions for select to authenticated
  using ((select private.is_evaluation_manager()));
create policy suggestion_publications_read on public.suggestion_publications for select to authenticated
  using ((select private.is_approved_user()));

revoke all on table public.evaluation_campaigns, public.evaluation_responses, public.evaluation_response_versions,
  public.evaluation_feedback, public.anonymous_program_responses, public.anonymous_suggestions, public.suggestion_publications
  from public, anon, authenticated;
grant select, insert, update on public.evaluation_campaigns to authenticated;
grant select on public.evaluation_responses, public.evaluation_response_versions, public.evaluation_feedback,
  public.anonymous_suggestions, public.suggestion_publications to authenticated;

-- Public RPC entrypoints are invoker wrappers; private schema is not exposed.
create function public.save_evaluation_response(p_campaign_id uuid, p_answers jsonb, p_submit boolean, p_expected_revision integer default null)
returns uuid language sql security invoker set search_path = '' as $$
  select private.save_evaluation_response(p_campaign_id, p_answers, p_submit, p_expected_revision);
$$;
create function public.reopen_evaluation_response(p_response_id uuid, p_reason text)
returns boolean language sql security invoker set search_path = '' as $$
  select private.reopen_evaluation_response(p_response_id, p_reason);
$$;
create function public.add_evaluation_feedback(p_response_id uuid, p_message text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.add_evaluation_feedback(p_response_id, p_message);
$$;
create function public.submit_anonymous_program_evaluation(p_campaign_id uuid, p_answers jsonb, p_nonce uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select private.submit_anonymous_program_evaluation(p_campaign_id, p_answers, p_nonce);
$$;
create function public.submit_anonymous_suggestion(p_category text, p_message text, p_proposal text, p_nonce uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select private.submit_anonymous_suggestion(p_category, p_message, p_proposal, p_nonce);
$$;
create function public.review_anonymous_suggestion(p_suggestion_id uuid, p_status text, p_resolution_summary text,
  p_owner_label text, p_due_date date, p_publish boolean, p_public_summary text)
returns boolean language sql security invoker set search_path = '' as $$
  select private.review_anonymous_suggestion(p_suggestion_id, p_status, p_resolution_summary,
    p_owner_label, p_due_date, p_publish, p_public_summary);
$$;
create function public.get_program_evaluation_summary(p_campaign_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.get_program_evaluation_summary(p_campaign_id);
$$;
create function public.get_evaluation_roster(p_campaign_id uuid)
returns table (profile_id uuid, full_name text, status text)
language sql stable security invoker set search_path = '' as $$
  select * from private.get_evaluation_roster(p_campaign_id);
$$;

-- Revoke PostgreSQL's default PUBLIC execution, including private helpers.
do $$
declare v_function record;
begin
  for v_function in select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'private' and p.proname in (
      'is_evaluation_manager', 'can_review_evaluation', 'can_participate_evaluation',
      'can_read_evaluation_campaign', 'can_read_evaluation_response', 'valid_evaluation_answers', 'guard_evaluation_campaign'))
      or (n.nspname in ('private', 'public') and p.proname in (
      'save_evaluation_response', 'reopen_evaluation_response', 'add_evaluation_feedback',
      'submit_anonymous_program_evaluation', 'submit_anonymous_suggestion',
      'review_anonymous_suggestion', 'get_program_evaluation_summary', 'get_evaluation_roster'))
  loop
    execute format('revoke all on function %I.%I(%s) from public, anon, authenticated', v_function.nspname, v_function.proname, v_function.args);
    if v_function.proname not in ('valid_evaluation_answers', 'guard_evaluation_campaign') then
      execute format('grant execute on function %I.%I(%s) to authenticated', v_function.nspname, v_function.proname, v_function.args);
    end if;
  end loop;
end;
$$;

comment on table public.anonymous_program_responses is 'No author or timestamp; raw rows are inaccessible to client roles. Closed campaigns release only groups with at least five answers.';
comment on table public.anonymous_suggestions is 'No author or exact timestamp. Free text is restricted to approved administrators/coordinators; publish only reviewed summaries separately.';
comment on table public.evaluation_response_versions is 'Append-only submitted snapshots. Drafts remain private, including after an audited reopening.';
