import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type HealthUnit = {
  id: string;
  name: string;
  city: string;
  address: string | null;
};

/**
 * Busca todas as unidades de saúde ativas do Supabase.
 */
export async function getHealthUnits(): Promise<HealthUnit[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("health_units")
    .select("id, name, city, address")
    .eq("active", true)
    .order("name");

  if (error) {
    throw new Error(`Erro ao buscar unidades: ${error.message}`);
  }

  return (data ?? []) as HealthUnit[];
}
