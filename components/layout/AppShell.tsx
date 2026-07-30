"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Database,
  FileUp,
  Home,
  LayoutDashboard,
  Map,
  MonitorCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UserCog,
  LogIn
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const publicNavItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/comunidade", label: "Comunidade", icon: BookOpen },
];

const protectedNavItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/manager-dashboard", label: "Gestão", icon: LayoutDashboard },
  { href: "/territorial-map", label: "Território", icon: Map },
  { href: "/campaign-planner", label: "Mutirão IA", icon: Sparkles },
  { href: "/campaign-execution", label: "Execução", icon: Activity },
  { href: "/campaign-report", label: "Relatório", icon: ShieldCheck },
  { href: "/municipal-report", label: "Municipal", icon: MonitorCheck },
  { href: "/municipal-goals", label: "Metas", icon: Target },
  { href: "/mobile", label: "Campo", icon: Smartphone },
  { href: "/data", label: "Dados SUS", icon: Database },
  { href: "/data-dictionary", label: "Dicionário", icon: BookOpen },
  { href: "/data-import", label: "Importar", icon: FileUp },
  { href: "/data-quality", label: "Qualidade", icon: ShieldCheck },
];

const adminNavItem = { href: "/admin/usuarios", label: "Usuários", icon: UserCog };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userState, setUserState] = useState<{
    isAuthenticated: boolean;
    isApproved: boolean;
    role: string | null;
  }>({
    isAuthenticated: false,
    isApproved: false,
    role: null,
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setUserState({ isAuthenticated: false, isApproved: false, role: null });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, account_status, active")
          .eq("id", user.id)
          .single();

        const isApproved = profile?.account_status === "aprovado" && profile?.active === true;
        setUserState({
          isAuthenticated: true,
          isApproved: Boolean(isApproved),
          role: profile?.role || null,
        });
      } catch {
        setUserState({ isAuthenticated: false, isApproved: false, role: null });
      }
    }

    checkAuth();
  }, [pathname]);

  const immersiveRoute = pathname === "/mobile" || pathname === "/comunidade";
  const showProtectedNav = userState.isAuthenticated && userState.isApproved;

  // Filtrar os itens de menu baseados nas permissões/papel
  const activeNavItems = showProtectedNav
    ? [
        ...protectedNavItems,
        ...(userState.role === "administrador" ? [adminNavItem] : []),
      ]
    : publicNavItems;

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-ink">
      {!immersiveRoute ? (
        <header className="app-shell-header sticky top-0 z-[1000] border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-folha text-white">
                <Activity size={21} />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-tight">
                  GIP Saúde Inteligente
                </span>
                <span className="block text-xs text-stone-500">
                  Gestão, território e dados SUS
                </span>
              </span>
            </Link>

            <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {activeNavItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
                      active
                        ? "border-folha bg-green-50 text-folha"
                        : "border-stone-200 bg-white text-stone-700 hover:border-folha hover:text-ink"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {showProtectedNav ? (
                <>
                  <Link
                    href="/campaign-planner"
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
                  >
                    <Sparkles size={16} />
                    <span className="hidden lg:inline">Sugerir mutirão</span>
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <Link
                  href="/entrar"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#1f7a4d] px-4 text-sm font-semibold text-white hover:bg-[#175d3a]"
                >
                  <LogIn size={16} />
                  <span>Entrar</span>
                </Link>
              )}
            </div>
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
}
