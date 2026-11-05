-- Administrative and operational work credited to academic collaborators.
-- Training, the two documented online meetings, and field visits have separate ledgers.
create table public.administrative_hours (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.program_cycles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  activity_title text not null check (length(trim(activity_title)) between 3 and 200),
  credited_hours numeric(6, 2) not null check (credited_hours > 0 and credited_hours <= 200),
  scope_note text not null check (length(trim(scope_note)) > 0),
  source_note text not null check (length(trim(source_note)) > 0),
  validation_status text not null default 'declarado' check (validation_status in ('declarado', 'validado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint administrative_hours_valid_period check (period_end >= period_start),
  constraint administrative_hours_unique unique (cycle_id, profile_id, period_start, period_end, activity_title)
);

create index administrative_hours_cycle_period_idx on public.administrative_hours (cycle_id, period_end desc);
create index administrative_hours_profile_idx on public.administrative_hours (profile_id, period_end desc);

alter table public.administrative_hours enable row level security;

create policy administrative_hours_read on public.administrative_hours
  for select to authenticated
  using ((select private.is_approved_user()) and ((select private.can_manage_gip()) or profile_id = (select auth.uid())));

create policy administrative_hours_insert_manager on public.administrative_hours
  for insert to authenticated
  with check ((select private.can_manage_gip()));

create policy administrative_hours_update_manager on public.administrative_hours
  for update to authenticated
  using ((select private.can_manage_gip()))
  with check ((select private.can_manage_gip()));

create policy administrative_hours_delete_manager on public.administrative_hours
  for delete to authenticated
  using ((select private.can_manage_gip()));

grant select, insert, update, delete on public.administrative_hours to authenticated;
