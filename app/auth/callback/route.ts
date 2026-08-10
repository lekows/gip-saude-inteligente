import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MANAGER_ROLES = [
  "administrador",
  "professor_coordenador",
  "professor_colaborador",
  "gestor_municipal",
];

const FIELD_ROLES = ["academico_colaborador", "academico_participante"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?error=auth_callback_failed`);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(`${origin}/entrar?error=auth_callback_failed`);
  }

  // Destino explícito (ex.: link de convite com "next") tem prioridade.
  // Restrito a caminhos internos para evitar open redirect.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Roteamento por papel do usuário
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/entrar?error=auth_callback_failed`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", user.id)
    .single();

  const isApproved =
    profile?.account_status === "aprovado" && profile?.active === true;

  let destination = "/aguardando-aprovacao";
  if (isApproved) {
    if (MANAGER_ROLES.includes(profile?.role ?? "")) {
      destination = "/manager-dashboard";
    } else if (FIELD_ROLES.includes(profile?.role ?? "")) {
      destination = "/mobile";
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
