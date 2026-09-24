-- Separate operational coordination hours from academic training attendance.
create table public.coordination_hours (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.program_cycles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  activity_date date not null,
  activity_title text not null check (length(trim(activity_title)) between 3 and 200),
  preparation_hours numeric(5, 2) not null default 0 check (preparation_hours >= 0 and preparation_hours <= 24),
  meeting_hours numeric(5, 2) not null default 0 check (meeting_hours >= 0 and meeting_hours <= 24),
  source_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coordination_hours_positive check (preparation_hours + meeting_hours > 0 and preparation_hours + meeting_hours <= 24),
  constraint coordination_hours_unique unique (cycle_id, profile_id, activity_date, activity_title)
);

create index coordination_hours_cycle_date_idx on public.coordination_hours (cycle_id, activity_date desc);
create index coordination_hours_profile_idx on public.coordination_hours (profile_id);

alter table public.coordination_hours enable row level security;

create policy coordination_hours_read on public.coordination_hours
  for select to authenticated
  using (
    (select private.is_approved_user())
    and ((select private.can_manage_gip()) or profile_id = (select auth.uid()))
  );

create policy coordination_hours_insert_manager on public.coordination_hours
  for insert to authenticated
  with check ((select private.can_manage_gip()));

create policy coordination_hours_update_manager on public.coordination_hours
  for update to authenticated
  using ((select private.can_manage_gip()))
  with check ((select private.can_manage_gip()));

create policy coordination_hours_delete_manager on public.coordination_hours
  for delete to authenticated
  using ((select private.can_manage_gip()));

grant select, insert, update, delete on public.coordination_hours to authenticated;
