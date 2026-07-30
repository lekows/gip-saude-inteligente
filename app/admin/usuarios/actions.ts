"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { VALID_ROLES, VALID_STATUSES, AppRole, AccountStatus } from "@/lib/auth/constants";

export { VALID_ROLES, VALID_STATUSES };

/**
 * Valida centralizadamente a sessão do administrador antes de qualquer ação administrativa.
 */
export async function validateAdminSession() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Autenticação necessária.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, account_status, active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Perfil de usuário não encontrado.");
  }

  if (profile.role !== "administrador" || profile.account_status !== "aprovado" || !profile.active) {
    throw new Error("Acesso negado. Apenas administradores ativos e aprovados têm permissão.");
  }

  return { user, profile, supabase };
}

/**
 * Verifica se o usuário de destino é o único administrador ativo no sistema.
 */
async function isLastActiveAdmin(supabase: any, targetUserId: string): Promise<boolean> {
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", targetUserId)
    .single();

  if (!targetProfile) return false;

  const isTargetAdmin =
    targetProfile.role === "administrador" &&
    targetProfile.account_status === "aprovado" &&
    targetProfile.active === true;

  if (!isTargetAdmin) return false;

  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "administrador")
    .eq("account_status", "aprovado")
    .eq("active", true);

  if (error || count === null) return false;

  return count <= 1;
}

export async function updateUserStatus(userId: string, status: string, active: boolean) {
  try {
    // 1. Validação estrita de tipos
    if (!VALID_STATUSES.includes(status as AccountStatus)) {
      return { error: `Status inválido: ${status}` };
    }

    // 2. Validação da sessão administrativa
    const { user: currentAdmin, supabase } = await validateAdminSession();

    // 3. Regra de negócio: Autossuspensão proibida no servidor
    if (userId === currentAdmin.id && (status !== "aprovado" || !active)) {
      return { error: "Um administrador não pode suspender ou desativar a própria conta." };
    }

    // 4. Regra de negócio: Proteção do último administrador
    if (status !== "aprovado" || !active) {
      const lastAdmin = await isLastActiveAdmin(supabase, userId);
      if (lastAdmin) {
        return { error: "Operação negada: Não é possível suspender o único administrador ativo do sistema." };
      }
    }

    // 5. Atualização atômica via RPC ou fallback com log obrigatório
    const { error: rpcError } = await supabase.rpc("admin_update_profile_status", {
      p_target_id: userId,
      p_status: status,
      p_active: active,
    });

    if (rpcError) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ account_status: status, active, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) return { error: updateError.message };

      const { error: auditError } = await supabase.from("audit_logs").insert({
        actor_id: currentAdmin.id,
        action: "update_status",
        entity_type: "profile",
        entity_id: userId,
        metadata: { status, active },
      });

      if (auditError) {
        console.error("Falha crítica ao gravar audit log:", auditError.message);
      }
    }

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Erro ao atualizar status do usuário." };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    // 1. Validação estrita de tipos
    if (!VALID_ROLES.includes(newRole as AppRole)) {
      return { error: `Papel inválido: ${newRole}` };
    }

    // 2. Validação da sessão administrativa
    const { user: currentAdmin, supabase } = await validateAdminSession();

    // 3. Regra de negócio: Autorebaixamento proibido no servidor
    if (userId === currentAdmin.id && newRole !== "administrador") {
      return { error: "Um administrador não pode alterar o próprio papel para outro diferente de administrador." };
    }

    // 4. Regra de negócio: Proteção do último administrador
    if (newRole !== "administrador") {
      const lastAdmin = await isLastActiveAdmin(supabase, userId);
      if (lastAdmin) {
        return { error: "Operação negada: Não é possível alterar o papel do único administrador ativo do sistema." };
      }
    }

    // 5. Atualização atômica via RPC ou fallback com log obrigatório
    const { error: rpcError } = await supabase.rpc("admin_update_profile_role", {
      p_target_id: userId,
      p_role: newRole,
    });

    if (rpcError) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) return { error: updateError.message };

      const { error: auditError } = await supabase.from("audit_logs").insert({
        actor_id: currentAdmin.id,
        action: "update_role",
        entity_type: "profile",
        entity_id: userId,
        metadata: { role: newRole },
      });

      if (auditError) {
        console.error("Falha crítica ao gravar audit log:", auditError.message);
      }
    }

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Erro ao atualizar papel do usuário." };
  }
}
