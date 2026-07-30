import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server.js";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { supabaseResponse, user: null, supabase: null };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user, supabase };
}

export function createRedirectWithCookies(
  request: NextRequest,
  redirectUrl: URL | string,
  supabaseResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(redirectUrl);

  // Copia todos os cookies atualizados pelo Supabase para a resposta de redirecionamento
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      sameSite: cookie.sameSite as any,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      expires: cookie.expires,
    });
  });

  return redirectResponse;
}
