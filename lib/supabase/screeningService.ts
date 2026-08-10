import { getSupabaseBrowserClient } from "./browser";

export type ScreeningInput = {
  patientCode?: string;
  patientName?: string;
  age?: number;
  sex?: string;
  neighborhood?: string;
  healthUnitId?: string;
  location?: string;
  hasHypertension?: boolean;
  hasDiabetes?: boolean;
  hasRespiratory?: boolean;
  bpSystolic?: number;
  bpDiastolic?: number;
  bloodGlucose?: number;
  bmi?: number;
  oxygenSaturation?: number;
  temperature?: number;
  healthEducation?: boolean;
  prescriptionGiven?: boolean;
  referredToUbs?: boolean;
  cardiovascularRisk?: boolean;
  homeVisitSuggested?: boolean;
  notes?: string;
};

export async function saveScreening(input: ScreeningInput) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("clinical_screenings")
    .insert({
      patient_code: input.patientCode,
      patient_name: input.patientName,
      age: input.age,
      sex: input.sex,
      neighborhood: input.neighborhood,
      health_unit_id: input.healthUnitId,
      location: input.location,
      has_hypertension: input.hasHypertension,
      has_diabetes: input.hasDiabetes,
      has_respiratory: input.hasRespiratory,
      bp_systolic: input.bpSystolic,
      bp_diastolic: input.bpDiastolic,
      blood_glucose: input.bloodGlucose,
      bmi: input.bmi,
      oxygen_saturation: input.oxygenSaturation,
      temperature: input.temperature,
      health_education: input.healthEducation,
      prescription_given: input.prescriptionGiven,
      referred_to_ubs: input.referredToUbs,
      cardiovascular_risk: input.cardiovascularRisk,
      home_visit_suggested: input.homeVisitSuggested,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getScreenings(filters?: {
  neighborhood?: string;
  healthUnitId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from("clinical_screenings")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.neighborhood) {
    query = query.eq("neighborhood", filters.neighborhood);
  }
  if (filters?.healthUnitId) {
    query = query.eq("health_unit_id", filters.healthUnitId);
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getScreeningStats(dateFrom?: string, dateTo?: string) {
  const supabase = getSupabaseBrowserClient();
  let query = supabase.from("clinical_screenings").select("*");

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data, error } = await query;
  if (error) throw error;

  const screenings = data ?? [];
  return {
    total: screenings.length,
    hasHypertension: screenings.filter((s) => s.has_hypertension).length,
    hasDiabetes: screenings.filter((s) => s.has_diabetes).length,
    referredToUbs: screenings.filter((s) => s.referred_to_ubs).length,
    cardiovascularRisk: screenings.filter((s) => s.cardiovascular_risk).length,
  };
}
