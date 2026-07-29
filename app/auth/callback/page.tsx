"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileAccess = {
  role: string | null;
  account_status: string | null;
  active: boolean | null;
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando seu acesso...");

  useEffect(() => {
    async function finishLogin() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) {
          setMessage("Não foi possível confirmar o acesso. Tente novamente.");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, account_status, active")
          .eq("id", data.user.id)
          .single();

        if (profileError) throw profileError;

        const profile = profileData as ProfileAccess | null;

        if (profile?.role === "administrador" && profile.active) {
          router.replace("/");
          return;
        }

        if (profile?.account_status !== "aprovado" || !profile?.active) {
          router.replace("/aguardando-aprovacao");
          return;
        }

        router.replace("/");
      } catch (error) {
        console.error("Falha ao concluir autenticacao", error);
        setMessage("Nao foi possivel concluir o acesso. Tente novamente.");
      }
    }

    finishLogin();
  }, [router]);

  return <main className="grid min-h-screen place-items-center bg-[#f7f7f2] p-6"><div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm"><p className="font-semibold text-ink">{message}</p></div></main>;
}
