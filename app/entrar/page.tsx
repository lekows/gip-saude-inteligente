"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, Chrome, Facebook, Monitor } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const oauthProviders = [
  {
    provider: "google" as const,
    label: "Continuar com Google",
    enabled: process.env.NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED === "true",
    icon: <Chrome size={19} />,
  },
  {
    provider: "azure" as const,
    label: "Continuar com Microsoft",
    enabled: process.env.NEXT_PUBLIC_SUPABASE_AUTH_AZURE_ENABLED === "true",
    icon: <Monitor size={19} />,
  },
  {
    provider: "facebook" as const,
    label: "Continuar com Facebook",
    enabled: process.env.NEXT_PUBLIC_SUPABASE_AUTH_FACEBOOK_ENABLED === "true",
    icon: <Facebook size={19} />,
  },
].filter(({ enabled }) => enabled);

export default function EntrarPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithProvider(provider: "google" | "azure" | "facebook") {
    setLoading(true);
    setMessage("Abrindo o provedor de acesso...");

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) {
        throw new Error("O provedor não retornou uma URL de autenticação.");
      }

      // Redirecionamento explícito é mais confiável no Safari/iOS/iPadOS
      // e em navegadores embutidos (WhatsApp, Instagram etc.).
      window.location.assign(data.url);
    } catch (error) {
      const providerUnavailable =
        error instanceof Error && error.message.includes("Unsupported provider");

      setMessage(
        providerUnavailable
          ? "Este provedor ainda não está habilitado. Use o acesso por e-mail."
          : error instanceof Error
            ? `Não foi possível abrir o acesso: ${error.message}`
            : "Não foi possível iniciar o acesso. Tente novamente.",
      );
      setLoading(false);
    }
  }

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
      setMessage("Enviamos um link de acesso para o seu e-mail.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-ink">
      <section className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm lg:grid-cols-2">
        <div className="bg-[#173d2b] p-8 text-white lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-200">GIP Saúde Inteligente</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">Acesso simples para professores, acadêmicos e gestores.</h1>
          <p className="mt-4 leading-7 text-green-50">Receba um link seguro no seu e-mail. Novos cadastros ficam aguardando aprovação antes de acessar informações internas.</p>
        </div>

        <div className="p-8 lg:p-12">
          <h2 className="text-2xl font-semibold">Entrar ou criar cadastro</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Informe seu e-mail para receber o link de acesso.</p>

          {oauthProviders.length > 0 && (
            <>
              <div className="mt-6 grid gap-3">
                {oauthProviders.map(({ provider, icon, label }) => (
                  <ProviderButton
                    key={provider}
                    icon={icon}
                    label={label}
                    onClick={() => signInWithProvider(provider)}
                    disabled={loading}
                  />
                ))}
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
                <span className="h-px flex-1 bg-stone-200" />
                ou use seu e-mail
                <span className="h-px flex-1 bg-stone-200" />
              </div>
            </>
          )}

          <form onSubmit={sendMagicLink} className={oauthProviders.length > 0 ? "space-y-3" : "mt-6 space-y-3"}>
            <label className="block text-sm font-medium" htmlFor="email">E-mail</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" className="h-11 w-full rounded-md border border-stone-300 px-3 outline-none focus:border-[#1f7a4d]" />
            <button disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1f7a4d] px-4 text-sm font-semibold text-white disabled:opacity-60">
              <Mail size={18} /> Receber link de acesso
            </button>
          </form>

          {message && <p className="mt-4 rounded-md bg-stone-100 p-3 text-sm text-stone-700">{message}</p>}
          <p className="mt-6 text-xs leading-5 text-stone-500">Ao continuar, você concorda em usar o sistema apenas para as atividades autorizadas do projeto.</p>
          <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#1f7a4d]">Voltar ao início</Link>
        </div>
      </section>
    </main>
  );
}

function ProviderButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-12 touch-manipulation items-center justify-center gap-3 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold hover:border-[#1f7a4d] active:bg-stone-50 disabled:opacity-60">{icon}{label}</button>;
}
