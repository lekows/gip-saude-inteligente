"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  account_status: string;
  active: boolean;
  created_at: string;
};

type CurrentUserProfile = Pick<Profile, "role">;

export default function GerenciarUsuariosPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();

      // Verifica se é coordenador/admin
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/entrar");
        return;
      }

      const { data: meData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      const me = meData as CurrentUserProfile | null;

      if (!me || !["administrador", "professor_coordenador"].includes(me.role)) {
        router.replace("/");
        return;
      }

      // Carrega todos os perfis
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, account_status, active, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Erro ao carregar usuários.");
      } else {
        setProfiles((data ?? []) as Profile[]);
      }
      setLoading(false);
    }

    load();
  }, [router]);

  async function updateStatus(id: string, status: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: status })
      .eq("id", id);

    if (error) {
      setMessage(`Erro: ${error.message}`);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, account_status: status } : p))
      );
      setMessage(status === "aprovado" ? "Usuário aprovado!" : "Usuário rejeitado.");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({ active })
      .eq("id", id);

    if (error) {
      setMessage(`Erro: ${error.message}`);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active } : p))
      );
    }
  }

  const pendentes = profiles.filter((p) => p.account_status === "pendente");
  const aprovados = profiles.filter((p) => p.account_status === "aprovado");

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f2]">
        <p className="text-stone-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 text-ink">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/manager-dashboard">
            <ArrowLeft size={20} className="text-stone-500 hover:text-ink" />
          </Link>
          <h1 className="text-2xl font-semibold">Gerenciar Usuários</h1>
        </div>

        {message && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {/* Resumo */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <Users size={24} className="mx-auto text-folha" />
            <p className="mt-2 text-2xl font-bold">{profiles.length}</p>
            <p className="text-xs text-stone-500">Total</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <Clock3 size={24} className="mx-auto text-amber-600" />
            <p className="mt-2 text-2xl font-bold">{pendentes.length}</p>
            <p className="text-xs text-stone-500">Pendentes</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <CheckCircle2 size={24} className="mx-auto text-green-600" />
            <p className="mt-2 text-2xl font-bold">{aprovados.length}</p>
            <p className="text-xs text-stone-500">Aprovados</p>
          </div>
        </div>

        {/* Pendentes */}
        {pendentes.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-700">
              <ShieldCheck size={20} />
              Aguardando aprovação ({pendentes.length})
            </h2>
            <div className="space-y-3">
              {pendentes.map((p) => (
                <UserCard
                  key={p.id}
                  profile={p}
                  isPending
                  onApprove={() => updateStatus(p.id, "aprovado")}
                  onReject={() => updateStatus(p.id, "suspenso")}
                />
              ))}
            </div>
          </section>
        )}

        {/* Aprovados */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-700">
            <UserCheck size={20} />
            Usuários aprovados ({aprovados.length})
          </h2>
          <div className="space-y-3">
            {aprovados.map((p) => (
              <UserCard
                key={p.id}
                profile={p}
                onToggleActive={() => toggleActive(p.id, !p.active)}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function UserCard({
  profile,
  isPending,
  onApprove,
  onReject,
  onToggleActive,
}: {
  profile: Profile;
  isPending?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onToggleActive?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4">
      <div>
        <p className="font-semibold">{profile.full_name || "Sem nome"}</p>
        <p className="text-sm text-stone-500">{profile.email}</p>
        <div className="mt-1 flex gap-2 text-xs">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
            {profile.role}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              profile.account_status === "aprovado"
                ? "bg-green-100 text-green-700"
                : profile.account_status === "pendente"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {profile.account_status}
          </span>
          {!profile.active && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
              inativo
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {isPending && (
          <>
            <Button
              className="h-9 px-3 bg-green-600 hover:bg-green-700"
              onClick={onApprove}
            >
              <CheckCircle2 size={16} className="mr-1" />
              Aprovar
            </Button>
            <Button
              variant="outline"
              className="h-9 px-3 border-red-300 text-red-600 hover:bg-red-50"
              onClick={onReject}
            >
              <UserX size={16} className="mr-1" />
              Rejeitar
            </Button>
          </>
        )}
        {!isPending && onToggleActive && (
          <Button
            className="h-9 px-3"
            variant={profile.active ? "outline" : "default"}
            onClick={onToggleActive}
          >
            {profile.active ? (
              <>
                <UserX size={16} className="mr-1" />
                Desativar
              </>
            ) : (
              <>
                <UserCheck size={16} className="mr-1" />
                Ativar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
