import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheck, UserCog, Ban, CheckCircle } from "lucide-react";
import { UserRow } from "./UserRow";

export default async function AdminUsuariosPage() {
  const supabase = await getSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/entrar");
  }

  // Verificar se é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    redirect("/manager-dashboard");
  }

  // Buscar todos os perfis
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, account_status, active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar usuários:", error);
    return (
      <main className="p-6">
        <p className="text-red-600">Erro ao carregar lista de usuários.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="text-folha" /> Administração de Usuários
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Aprove, suspenda ou altere os níveis de acesso das contas.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-stone-700">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Nome e E-mail</th>
              <th className="px-6 py-4 font-semibold">Papel</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {users?.map((u) => (
              <UserRow key={u.id} user={u} currentUserId={user.id} />
            ))}
          </tbody>
        </table>
        {(!users || users.length === 0) && (
          <div className="p-8 text-center text-stone-500">Nenhum usuário encontrado.</div>
        )}
      </div>
    </main>
  );
}
