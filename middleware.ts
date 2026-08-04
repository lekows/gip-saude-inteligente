import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas (não precisam de login)
const PUBLIC_PREFIXES = [
  "/",
  "/entrar",
  "/auth",
  "/comunidade",
  "/api",
  "/_next",
  "/favicon",
];

// Rotas que qualquer usuário logado pode acessar
const AUTHENTICATED_ONLY = [
  "/aguardando-aprovacao",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Libera rotas públicas
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Libera assets estáticos
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|json)$/.test(pathname)) {
    return NextResponse.next();
  }

  // Verifica se existe token de auth do Supabase no cookie
  const hasToken = request.cookies.has("sb-qkevrhbxysijtlrkianb-auth-token");

  if (!hasToken) {
    const loginUrl = new URL("/entrar", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token existe: libera acesso por enquanto.
  // A verificação detalhada de role e aprovação é feita
  // no callback de auth e nos componentes das páginas protegidas.
  if (AUTHENTICATED_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
