"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando seu acesso...");

  useEffect(() => {
    async function finishLogin() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          setMessage("Não foi possível confirmar o acesso. Tente novamente.");
          return;
        }

        await supabase.rpc("claim_first_admin");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, approval_status, active")
          .eq("id", data.session.user.id)
          .single();

        if (profile?.role === "administrador" && profile.active) {
          router.replace("/");
          return;
        }

        if (profile?.approval_status !== "aprovado" || !profile?.active) {
          router.replace("/aguardando-aprovacao");
          return;
        }

        router.replace("/");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Erro ao concluir o acesso.");
      }
    }

    finishLogin();
  }, [router]);

  return <main className="grid min-h-screen place-items-center bg-[#f7f7f2] p-6"><div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm"><p className="font-semibold text-ink">{message}</p></div></main>;
}
