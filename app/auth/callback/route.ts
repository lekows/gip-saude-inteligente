import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedHome } from "@/lib/auth/accessDestination";

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

  if (!isApproved) {
    return NextResponse.redirect(`${origin}/aguardando-aprovacao`);
  }

  // Explicit internal links preserve the user's chosen destination.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Device affects only the initial experience; profile permissions remain authoritative.
  const destination = getAuthenticatedHome(request.headers);
  return NextResponse.redirect(`${origin}${destination}`);
}
