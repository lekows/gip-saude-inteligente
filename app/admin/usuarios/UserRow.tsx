"use client";

import { useState } from "react";
import { updateUserStatus, updateUserRole } from "./actions";
import { CheckCircle, Ban, Loader2 } from "lucide-react";

type User = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  account_status: string;
  active: boolean;
};

export function UserRow({ user, currentUserId }: { user: User; currentUserId: string }) {
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === currentUserId;

  async function handleApprove() {
    setLoading(true);
    await updateUserStatus(user.id, "aprovado", true);
    setLoading(false);
  }

  async function handleSuspend() {
    if (!confirm("Tem certeza que deseja suspender este usuário?")) return;
    setLoading(true);
    await updateUserStatus(user.id, "suspenso", false);
    setLoading(false);
  }

  async function handleRoleChange(newRole: string) {
    if (newRole === user.role) return;
    if (!confirm(`Alterar o papel deste usuário para ${newRole}?`)) return;
    
    setLoading(true);
    await updateUserRole(user.id, newRole);
    setLoading(false);
  }

  return (
    <tr className="hover:bg-stone-50 transition">
      <td className="px-6 py-4">
        <div className="font-medium text-stone-900">{user.full_name} {isSelf && <span className="text-xs ml-2 bg-stone-200 text-stone-600 px-2 py-0.5 rounded">Você</span>}</div>
        <div className="text-stone-500 text-xs">{user.email || "Sem e-mail"}</div>
      </td>
      <td className="px-6 py-4">
        <select
          disabled={loading || isSelf}
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="bg-stone-50 border border-stone-200 text-stone-700 text-xs rounded focus:ring-[#1f7a4d] focus:border-[#1f7a4d] block w-full p-2 disabled:opacity-50"
        >
          <option value="administrador">Administrador</option>
          <option value="professor_coordenador">Professor Coordenador</option>
          <option value="professor_colaborador">Professor Colaborador</option>
          <option value="academico_colaborador">Acadêmico Colaborador</option>
          <option value="academico_participante">Acadêmico Participante</option>
          <option value="gestor_municipal">Gestor Municipal</option>
        </select>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          user.account_status === "aprovado" 
            ? "bg-green-100 text-green-700" 
            : user.account_status === "suspenso" 
            ? "bg-red-100 text-red-700" 
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {user.account_status === "aprovado" ? <CheckCircle size={14} /> : user.account_status === "suspenso" ? <Ban size={14} /> : <Loader2 size={14} className="animate-spin" />}
          {user.account_status.charAt(0).toUpperCase() + user.account_status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        {loading ? (
          <Loader2 size={18} className="animate-spin text-stone-400 inline-block" />
        ) : (
          <div className="flex items-center justify-end gap-2">
            {!isSelf && user.account_status !== "aprovado" && (
              <button
                onClick={handleApprove}
                className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
              >
                <CheckCircle size={14} /> Aprovar
              </button>
            )}
            {!isSelf && user.account_status !== "suspenso" && (
              <button
                onClick={handleSuspend}
                className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
              >
                <Ban size={14} /> Suspender
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
