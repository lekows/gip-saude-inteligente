-- GIP Saúde Inteligente - esquema inicial

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'administrador',
  'professor_coordenador',
  'professor_colaborador',
  'academico_colaborador',
  'academico_participante',
  'gestor_municipal'
);

create type public.member_status as enum ('pendente', 'ativo', 'inativo');
create type public.cycle_status as enum ('planejamento', 'ativo', 'concluido', 'cancelado');
create type public.class_status as enum ('planejada', 'aberta', 'concluida', 'cancelada');
create type public.enrollment_status as enum ('inscrito', 'em_andamento', 'concluido', 'cancelado');
create type public.attendance_status as enum ('presente', 'ausente', 'justificado');
create type public.activity_status as enum ('planejada', 'em_andamento', 'concluida', 'cancelada');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document_number text,
  organization_type text not null default 'instituicao_ensino',
  city text,
  state char(2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.health_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  cnes text,
  city text not null,
  state char(2) not null default 'GO',
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cnes)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role public.app_role not null default 'academico_participante',
  organization_id uuid references public.organizations(id) on delete set null,
  phone text,
  registration_number text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  status public.cycle_status not null default 'planejamento',
  workload_hours numeric(7,2) not null default 0 check (workload_hours >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.program_members (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.program_cycles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.app_role not null,
  status public.member_status not null default 'pendente',
  joined_at date,
  left_at date,
  target_workload_hours numeric(7,2) not null default 0 check (target_workload_hours >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, profile_id),
  check (left_at is null or joined_at is null or left_at >= joined_at)
);

create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  area text,
  workload_hours numeric(6,2) not null check (workload_hours > 0),
  mandatory boolean not null default false,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_classes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete restrict,
  cycle_id uuid not null references public.program_cycles(id) on delete cascade,
  instructor_id uuid references public.profiles(id) on delete set null,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  capacity integer check (capacity is null or capacity > 0),
  status public.class_status not null default 'planejada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.training_classes(id) on delete cascade,
  member_id uuid not null references public.program_members(id) on delete cascade,
  status public.enrollment_status not null default 'inscrito',
  completed_workload_hours numeric(6,2) not null default 0 check (completed_workload_hours >= 0),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (class_id, member_id)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  status public.attendance_status not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id),
  check (check_out_at is null or check_in_at is null or check_out_at >= check_in_at)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.program_cycles(id) on delete cascade,
  health_unit_id uuid references public.health_units(id) on delete set null,
  title text not null,
  description text,
  activity_type text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  workload_hours numeric(6,2) not null default 0 check (workload_hours >= 0),
  status public.activity_status not null default 'planejada',
  responsible_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.evidences (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  file_path text not null,
  file_name text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_program_members_cycle on public.program_members(cycle_id);
create index idx_program_members_profile on public.program_members(profile_id);
create index idx_training_classes_cycle on public.training_classes(cycle_id);
create index idx_training_enrollments_member on public.training_enrollments(member_id);
create index idx_activities_cycle on public.activities(cycle_id);
create index idx_activities_health_unit on public.activities(health_unit_id);
create index idx_evidences_activity on public.evidences(activity_id);
create index idx_audit_logs_actor on public.audit_logs(actor_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger health_units_set_updated_at before update on public.health_units for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger program_cycles_set_updated_at before update on public.program_cycles for each row execute function public.set_updated_at();
create trigger program_members_set_updated_at before update on public.program_members for each row execute function public.set_updated_at();
create trigger training_modules_set_updated_at before update on public.training_modules for each row execute function public.set_updated_at();
create trigger training_classes_set_updated_at before update on public.training_classes for each row execute function public.set_updated_at();
create trigger attendance_records_set_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
create trigger activities_set_updated_at before update on public.activities for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.can_manage_gip()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('administrador', 'professor_coordenador'), false);
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.can_manage_gip() to authenticated;

alter table public.organizations enable row level security;
alter table public.health_units enable row level security;
alter table public.profiles enable row level security;
alter table public.program_cycles enable row level security;
alter table public.program_members enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_classes enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.attendance_records enable row level security;
alter table public.activities enable row level security;
alter table public.evidences enable row level security;
alter table public.audit_logs enable row level security;

create policy organizations_read_authenticated on public.organizations for select to authenticated using (true);
create policy organizations_manage on public.organizations for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy health_units_read_authenticated on public.health_units for select to authenticated using (true);
create policy health_units_manage on public.health_units for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy profiles_read_self_or_manager on public.profiles for select to authenticated using (id = auth.uid() or public.can_manage_gip());
create policy profiles_update_self_or_manager on public.profiles for update to authenticated using (id = auth.uid() or public.can_manage_gip()) with check (id = auth.uid() or public.can_manage_gip());
create policy profiles_insert_manager on public.profiles for insert to authenticated with check (public.can_manage_gip());
create policy profiles_delete_manager on public.profiles for delete to authenticated using (public.can_manage_gip());
create policy cycles_read_authenticated on public.program_cycles for select to authenticated using (true);
create policy cycles_manage on public.program_cycles for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy members_read_self_or_manager on public.program_members for select to authenticated using (profile_id = auth.uid() or public.can_manage_gip());
create policy members_manage on public.program_members for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy modules_read_authenticated on public.training_modules for select to authenticated using (active or public.can_manage_gip());
create policy modules_manage on public.training_modules for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy classes_read_authenticated on public.training_classes for select to authenticated using (true);
create policy classes_manage on public.training_classes for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy enrollments_read_self_or_manager on public.training_enrollments for select to authenticated using (public.can_manage_gip() or exists (select 1 from public.program_members pm where pm.id = member_id and pm.profile_id = auth.uid()));
create policy enrollments_manage on public.training_enrollments for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy attendance_read_self_or_manager on public.attendance_records for select to authenticated using (public.can_manage_gip() or exists (select 1 from public.training_enrollments te join public.program_members pm on pm.id = te.member_id where te.id = enrollment_id and pm.profile_id = auth.uid()));
create policy attendance_manage on public.attendance_records for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy activities_read_authenticated on public.activities for select to authenticated using (true);
create policy activities_manage on public.activities for all to authenticated using (public.can_manage_gip()) with check (public.can_manage_gip());
create policy evidences_read on public.evidences for select to authenticated using (is_public or uploaded_by = auth.uid() or public.can_manage_gip());
create policy evidences_insert on public.evidences for insert to authenticated with check (uploaded_by = auth.uid() or public.can_manage_gip());
create policy evidences_update on public.evidences for update to authenticated using (uploaded_by = auth.uid() or public.can_manage_gip()) with check (uploaded_by = auth.uid() or public.can_manage_gip());
create policy evidences_delete on public.evidences for delete to authenticated using (uploaded_by = auth.uid() or public.can_manage_gip());
create policy audit_logs_read_manager on public.audit_logs for select to authenticated using (public.can_manage_gip());
create policy audit_logs_insert_authenticated on public.audit_logs for insert to authenticated with check (actor_id = auth.uid() or actor_id is null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gip-evidencias', 'gip-evidencias', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy evidence_files_read on storage.objects for select to authenticated using (bucket_id = 'gip-evidencias');
create policy evidence_files_insert on storage.objects for insert to authenticated with check (bucket_id = 'gip-evidencias');
create policy evidence_files_update on storage.objects for update to authenticated using (bucket_id = 'gip-evidencias') with check (bucket_id = 'gip-evidencias');
create policy evidence_files_delete on storage.objects for delete to authenticated using (bucket_id = 'gip-evidencias');
