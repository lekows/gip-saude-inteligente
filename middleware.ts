import { NextResponse, type NextRequest } from "next/server";
import { updateSession, createRedirectWithCookies } from "@/lib/supabase/middleware";

const publicRoutes = ["/entrar", "/auth/callback", "/aguardando-aprovacao", "/comunidade", "/"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Ignorar arquivos estáticos e otimizados pelo Next.js
  if (path.startsWith("/_next") || path.match(/\.(.*)$/)) {
    return supabaseResponse;
  }

  const isPublicRoute = publicRoutes.includes(path);

  // 1. Caso o usuário NÃO esteja autenticado
  if (!user || !supabase) {
    if (!isPublicRoute) {
      url.pathname = "/entrar";
      return createRedirectWithCookies(request, url, supabaseResponse);
    }
    return supabaseResponse;
  }

  // 2. Se o usuário ESTIVER autenticado, buscamos o perfil para autorização
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", user.id)
    .single();

  // Sem perfil cadastrado
  if (!profile) {
    if (!isPublicRoute) {
      url.pathname = "/aguardando-aprovacao";
      return createRedirectWithCookies(request, url, supabaseResponse);
    }
    return supabaseResponse;
  }

  const isApproved = profile.account_status === "aprovado" && profile.active === true;

  // 3. Usuário NÃO aprovado ou suspenso
  if (!isApproved) {
    // Se tentar acessar rota protegida ou /entrar, redireciona para /aguardando-aprovacao
    if (!isPublicRoute || path === "/entrar") {
      url.pathname = "/aguardando-aprovacao";
      return createRedirectWithCookies(request, url, supabaseResponse);
    }
    return supabaseResponse;
  }

  // 4. Usuário APROVADO: retira das páginas de entrada/espera
  if (path === "/entrar" || path === "/aguardando-aprovacao") {
    url.pathname = "/manager-dashboard";
    return createRedirectWithCookies(request, url, supabaseResponse);
  }

  // 5. Bloqueia rotas administrativas se não for administrador
  if (path.startsWith("/admin") && profile.role !== "administrador") {
    url.pathname = "/manager-dashboard";
    return createRedirectWithCookies(request, url, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
