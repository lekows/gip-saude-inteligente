-- Individual academic credit for field activities. Meeting preparation stays in coordination_hours.
create table public.activity_participant_hours (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  activity_date date not null,
  credited_hours numeric(6, 2) not null check (credited_hours > 0 and credited_hours <= 24),
  source_note text not null check (length(trim(source_note)) > 0),
  created_at timestamptz not null default now(),
  constraint activity_participant_hours_unique unique (activity_id, profile_id)
);

create index activity_participant_hours_profile_idx on public.activity_participant_hours (profile_id, activity_date desc);
create index activity_participant_hours_activity_idx on public.activity_participant_hours (activity_id);

alter table public.activity_participant_hours enable row level security;

create policy activity_participant_hours_read on public.activity_participant_hours
  for select to authenticated
  using ((select private.is_approved_user()) and ((select private.can_manage_gip()) or profile_id = (select auth.uid())));

create policy activity_participant_hours_insert_manager on public.activity_participant_hours
  for insert to authenticated
  with check ((select private.can_manage_gip()));

create policy activity_participant_hours_update_manager on public.activity_participant_hours
  for update to authenticated
  using ((select private.can_manage_gip()))
  with check ((select private.can_manage_gip()));

create policy activity_participant_hours_delete_manager on public.activity_participant_hours
  for delete to authenticated
  using ((select private.can_manage_gip()));

grant select, insert, update, delete on public.activity_participant_hours to authenticated;
