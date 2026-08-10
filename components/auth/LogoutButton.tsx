"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.refresh();
      router.replace("/entrar");
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-red-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      title="Sair do sistema"
    >
      <LogOut size={16} />
      <span className="hidden lg:inline">Sair</span>
    </button>
  );
}
