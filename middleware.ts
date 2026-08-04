import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas (não precisam de login)
const PUBLIC_ROUTES = [
  "/",
  "/entrar",
  "/auth/callback",
  "/comunidade",
  "/api",
];

// Rotas que qualquer usuário autenticado pode acessar
const AUTHENTICATED_ROUTES = [
  "/aguardando-aprovacao",
];

// Rotas por perfil
const ROLE_ROUTES: Record<string, string[]> = {
  administrador: ["/manager-dashboard", "/campaign-planner", "/campaign-execution", "/campaign-report", "/territorial-map", "/municipal-report", "/municipal-goals", "/data", "/data-import", "/data-quality"],
  professor_coordenador: ["/manager-dashboard", "/campaign-planner", "/campaign-execution", "/campaign-report", "/territorial-map", "/municipal-report", "/municipal-goals", "/data", "/data-import", "/data-quality"],
  professor_colaborador: ["/manager-dashboard", "/campaign-execution", "/territorial-map", "/data"],
  gestor_municipal: ["/manager-dashboard", "/municipal-report", "/municipal-goals", "/territorial-map"],
  academico_colaborador: ["/mobile"],
  academico_participante: ["/mobile"],
};

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((r) => path === r || path.startsWith(r + "/"));
}

function isAuthenticatedRoute(path: string): boolean {
  return AUTHENTICATED_ROUTES.some((r) => path === r || path.startsWith(r + "/"));
}

function hasRouteAccess(role: string | null, path: string): boolean {
  const allowed = ROLE_ROUTES[role ?? ""];
  if (!allowed) return false;
  return allowed.some((r) => path === r || path.startsWith(r + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas sempre liberadas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Verifica token nos cookies do Supabase Auth
  const token = request.cookies.get("sb-qkevrhbxysijtlrkianb-auth-token")?.value;

  // Sem token = não autenticado
  if (!token) {
    const loginUrl = new URL("/entrar", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Com token: verificar se está aprovado e tem permissão para a rota
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=role,account_status,active&id=eq.${getUserIdFromToken(token)}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Falha ao verificar perfil");

    const profiles = await res.json();
    const profile = profiles[0];

    if (!profile || profile.account_status !== "aprovado" || !profile.active) {
      return NextResponse.redirect(new URL("/aguardando-aprovacao", request.url));
    }

    // Verifica permissão de rota
    if (isAuthenticatedRoute(pathname)) {
      return NextResponse.next();
    }

    if (!hasRouteAccess(profile.role, pathname)) {
      // Redireciona para a home do seu perfil
      const homeRoute = profile.role === "academico_participante" || profile.role === "academico_colaborador"
        ? "/mobile"
        : "/manager-dashboard";
      return NextResponse.redirect(new URL(homeRoute, request.url));
    }

    return NextResponse.next();
  } catch {
    // Token inválido ou erro de rede
    const loginUrl = new URL("/entrar", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
