import { getSupabaseBrowserClient } from "./browser";

export type PatientFilters = {
  priorityLevel?: string;
  neighborhood?: string;
  healthUnitId?: string;
  minScore?: number;
  maxScore?: number;
  ageMin?: number;
  ageMax?: number;
};

export async function getPatients(filters?: PatientFilters) {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from("patients")
    .select("*")
    .eq("active", true)
    .order("priority_score", { ascending: false });

  if (filters?.priorityLevel) {
    query = query.eq("priority_level", filters.priorityLevel);
  }
  if (filters?.neighborhood) {
    query = query.eq("neighborhood", filters.neighborhood);
  }
  if (filters?.healthUnitId) {
    query = query.eq("health_unit_id", filters.healthUnitId);
  }
  if (filters?.minScore !== undefined) {
    query = query.gte("priority_score", filters.minScore);
  }
  if (filters?.maxScore !== undefined) {
    query = query.lte("priority_score", filters.maxScore);
  }
  if (filters?.ageMin !== undefined) {
    query = query.gte("age", filters.ageMin);
  }
  if (filters?.ageMax !== undefined) {
    query = query.lte("age", filters.ageMax);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPatientsByNeighborhood() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("patients")
    .select("neighborhood, priority_level, count")
    .eq("active", true)
    .order("neighborhood");

  if (error) throw error;
  return data ?? [];
}

export async function getPatientStats() {
  const supabase = getSupabaseBrowserClient();

  const [
    { count: total },
    { count: alta },
    { count: media },
    { count: idosos },
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("active", true).eq("priority_level", "Alta"),
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("active", true).eq("priority_level", "Média"),
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("active", true).gte("age", 60),
  ]);

  return {
    total: total ?? 0,
    alta: alta ?? 0,
    media: media ?? 0,
    idosos: idosos ?? 0,
  };
}

export async function getNeighborhoods() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("patients")
    .select("neighborhood")
    .eq("active", true);

  if (error) throw error;
  const unique = [...new Set((data ?? []).map((p) => p.neighborhood))];
  return unique.sort();
}

export async function getHealthUnits() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("health_units")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}
