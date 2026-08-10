-- Historical migration applied to the hosted project on 2026-08-04.
-- A later migration tightens privacy policies and removes identifiable fields.

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text not null unique,
  household_id text,
  neighborhood text not null,
  health_unit_id uuid references public.health_units(id),
  latitude numeric,
  longitude numeric,
  age integer not null check (age >= 0),
  sex text not null check (sex in ('F', 'M')),
  has_hypertension boolean default false,
  has_diabetes boolean default false,
  registered_in_aps boolean default false,
  valid_cpf boolean default false,
  last_bp_date date,
  last_hba1c_date date,
  visits_last_12m integer default 0,
  address_quality text,
  medication_pickup_signal boolean default false,
  gap_registration numeric default 0,
  gap_bp numeric default 0,
  gap_hba1c numeric default 0,
  gap_address numeric default 0,
  gap_visit numeric default 0,
  gap_elderly numeric default 0,
  gap_comorbidity numeric default 0,
  priority_score numeric not null default 0,
  priority_level text not null default 'Baixa' check (priority_level in ('Alta', 'Média', 'Baixa')),
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.clinical_screenings (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references public.activities(id),
  patient_code text,
  patient_name text,
  age integer,
  sex text,
  neighborhood text,
  health_unit_id uuid references public.health_units(id),
  location text,
  has_hypertension boolean default false,
  has_diabetes boolean default false,
  has_respiratory boolean default false,
  bp_systolic integer,
  bp_diastolic integer,
  blood_glucose integer,
  bmi numeric,
  oxygen_saturation integer,
  temperature numeric,
  health_education boolean default false,
  prescription_given boolean default false,
  referred_to_ubs boolean default false,
  cardiovascular_risk boolean default false,
  home_visit_suggested boolean default false,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.patients enable row level security;
alter table public.clinical_screenings enable row level security;

create policy patients_select_all on public.patients for select using (true);
create policy patients_insert_admin on public.patients for insert with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('administrador', 'professor_coordenador', 'professor_colaborador')
  )
);
create policy patients_update_admin on public.patients for update using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('administrador', 'professor_coordenador', 'professor_colaborador')
  )
);

create policy screenings_select_all on public.clinical_screenings for select using (true);
create policy screenings_insert_any on public.clinical_screenings for insert
with check (auth.uid() is not null);
create policy screenings_update_own on public.clinical_screenings for update
using (recorded_by = auth.uid());
