"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Send, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

type InviteResult = {
  email: string;
  status: "success" | "error" | "skipped";
  message: string;
};

export default function ConvidarAlunosPage() {
  const router = useRouter();
  const [emailsInput, setEmailsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/entrar?redirect=/convidar-alunos");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, account_status, active")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.active || profile.account_status !== "aprovado") {
        router.replace("/aguardando-aprovacao");
        return;
      }

      const allowedRoles = ["administrador", "professor_coordenador", "professor_colaborador"];
      if (!allowedRoles.includes(profile.role ?? "")) {
        router.replace("/manager-dashboard");
        return;
      }

      setIsCoordinator(true);
      setAuthChecked(true);
    }

    checkAuth();
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResults([]);

    // Parse e-mails: suporta um por linha, vírgula, ou ponto-e-vírgula
    const emails = emailsInput
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes("@"));

    if (emails.length === 0) {
      setResults([{ email: "", status: "error", message: "Nenhum e-mail válido encontrado." }]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const newResults: InviteResult[] = [];

    for (const email of emails) {
      try {
        // Verifica se já existe perfil com este e-mail
        const { data: existing } = await supabase
          .from("profiles")
          .select("id, email, account_status")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          newResults.push({
            email,
            status: "skipped",
            message: `Já existe cadastro (status: ${existing.account_status}).`,
          });
          continue;
        }

        // Como não podemos criar auth.users via anon key, criamos apenas o perfil
        // O aluno precisará fazer login via Magic Link ou Google OAuth
        // O trigger handle_new_user cria o perfil automaticamente no auth.users
        // Mas aqui nós pré-cadastramos o perfil para já deixar como 'pendente'
        const { error } = await supabase.from("profiles").insert({
          email,
          full_name: email.split("@")[0],
          role: "academico_participante",
          account_status: "pendente",
          active: true,
        });

        if (error) {
          newResults.push({ email, status: "error", message: error.message });
        } else {
          newResults.push({
            email,
            status: "success",
            message: "Convite enviado! O aluno deve acessar /entrar e fazer login.",
          });
        }
      } catch (err) {
        newResults.push({
          email,
          status: "error",
          message: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  }

  if (!authChecked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f2]">
        <p className="text-stone-500">Verificando acesso...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 text-ink">
      <section className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/manager-dashboard">
            <ArrowLeft size={20} className="text-stone-500 hover:text-ink" />
          </Link>
          <h1 className="text-2xl font-semibold">Convidar Alunos</h1>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm text-stone-600">
            <Users size={18} className="text-folha" />
            <span>Adicione os e-mails dos alunos que participarão do treinamento.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium" htmlFor="emails">
              E-mails dos alunos
            </label>
            <textarea
              id="emails"
              rows={6}
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              placeholder="aluno1@email.com&#10;aluno2@email.com&#10;aluno3@email.com"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#1f7a4d]"
              required
            />
            <p className="text-xs text-stone-500">
              Um e-mail por linha, ou separados por vírgula/ponto-e-vírgula.
            </p>

            <Button type="submit" disabled={loading} className="w-full">
              <Send size={17} className="mr-2" />
              {loading ? "Enviando convites..." : "Enviar convites"}
            </Button>
          </form>

          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold">Resultados:</h3>
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-md p-3 text-sm ${
                    r.status === "success"
                      ? "border border-green-200 bg-green-50 text-green-800"
                      : r.status === "skipped"
                      ? "border border-amber-200 bg-amber-50 text-amber-800"
                      : "border border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {r.status === "success" ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  ) : r.status === "skipped" ? (
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">{r.email}</span>
                    <p className="text-xs opacity-80">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Como os alunos vão acessar?</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-600">
            <li>
              Você adiciona os e-mails aqui (o cadastro fica como <strong>pendente</strong>).
            </li>
            <li>
              Os alunos acessam{" "}
              <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">
                https://gip-saude-inteligente.vercel.app/entrar
              </code>
            </li>
            <li>
              Eles fazem login com <strong>Google</strong> ou recebem um{" "}
              <strong>link por e-mail</strong> (Magic Link).
            </li>
            <li>
              Após o login, eles ficam na tela{" "}
              <strong>&quot;Aguardando aprovação&quot;</strong>.
            </li>
            <li>
              Você aprova os cadastros em{" "}
              <Link href="/gerenciar-usuarios" className="text-folha underline">
                Gerenciar Usuários
              </Link>
              .
            </li>
            <li>Os alunos aprovados acessam o app mobile para registrar abordagens e triagens.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
