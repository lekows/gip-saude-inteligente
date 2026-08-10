import { redirect } from "next/navigation";

// Rota legada: o painel seguro de administração de usuários
// (server actions + RPC atômica + auditoria) vive em /admin/usuarios.
export default function GerenciarUsuariosPage() {
  redirect("/admin/usuarios");
}
