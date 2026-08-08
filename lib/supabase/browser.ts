import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient<any> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("As variáveis públicas do Supabase ainda não foram configuradas.");
  }

  if (!browserClient) {
    browserClient = createClient<any>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
