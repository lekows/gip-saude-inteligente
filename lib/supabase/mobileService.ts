import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ScreeningInsert = {
  patient_name: string | null;
  age: number | null;
  sex: string | null;
  neighborhood: string | null;
  has_hypertension: boolean;
  has_diabetes: boolean;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_glucose: number | null;
  bmi: number | null;
  notes: string | null;
  recorded_by: string | null;
};

/**
 * Salva uma triagem clínica no Supabase.
 * Usa o ID do usuário logado como recorded_by.
 */
export async function saveScreening(data: {
  patientName?: string;
  age?: number;
  sex?: string;
  neighborhood?: string;
  hasHypertension?: boolean;
  hasDiabetes?: boolean;
  bpSystolic?: number;
  bpDiastolic?: number;
  bloodGlucose?: number;
  bmi?: number;
  notes?: string;
}) {
  const supabase = getSupabaseBrowserClient();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const insertData: ScreeningInsert = {
    patient_name: data.patientName || null,
    age: data.age ?? null,
    sex: data.sex || null,
    neighborhood: data.neighborhood || null,
    has_hypertension: data.hasHypertension ?? false,
    has_diabetes: data.hasDiabetes ?? false,
    bp_systolic: data.bpSystolic ?? null,
    bp_diastolic: data.bpDiastolic ?? null,
    blood_glucose: data.bloodGlucose ?? null,
    bmi: data.bmi ?? null,
    notes: data.notes || null,
    recorded_by: userId,
  };

  const { data: result, error } = await supabase
    .from("clinical_screenings")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao salvar triagem: ${error.message}`);
  }

  return result as { id: string } & Record<string, unknown>;
}

/**
 * Busca as triagens registradas pelo usuário logado.
 */
export async function getMyScreenings() {
  const supabase = getSupabaseBrowserClient();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("clinical_screenings")
    .select("*")
    .eq("recorded_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar triagens: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Sincroniza registros offline pendentes com o Supabase.
 * Retorna os resultados de cada tentativa de sync.
 */
export async function syncOfflineScreenings(
  offlineRecords: Array<{
    id: string;
    patientName?: string;
    age?: number;
    sex?: string;
    neighborhood?: string;
    hasHypertension?: boolean;
    hasDiabetes?: boolean;
    bpSystolic?: number;
    bpDiastolic?: number;
    bloodGlucose?: number;
    bmi?: number;
    notes?: string;
    createdAt: string;
  }>
) {
  const results: Array<{
    localId: string;
    status: "synced" | "error";
    message: string;
    remoteId?: string;
  }> = [];

  for (const record of offlineRecords) {
    try {
      const result = await saveScreening({
        patientName: record.patientName,
        age: record.age,
        sex: record.sex,
        neighborhood: record.neighborhood,
        hasHypertension: record.hasHypertension,
        hasDiabetes: record.hasDiabetes,
        bpSystolic: record.bpSystolic,
        bpDiastolic: record.bpDiastolic,
        bloodGlucose: record.bloodGlucose,
        bmi: record.bmi,
        notes: `${record.notes || ""} (registrado offline em ${new Date(record.createdAt).toLocaleString("pt-BR")})`,
      });

      results.push({
        localId: record.id,
        status: "synced",
        message: "Sincronizado com sucesso",
        remoteId: result.id,
      });
    } catch (err) {
      results.push({
        localId: record.id,
        status: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  return results;
}
