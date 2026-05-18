"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Database,
  FileUp,
  Home,
  LayoutDashboard,
  Map,
  MonitorCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/manager-dashboard", label: "Gestao", icon: LayoutDashboard },
  { href: "/territorial-map", label: "Territorio", icon: Map },
  { href: "/campaign-planner", label: "Mutirao IA", icon: Sparkles },
  { href: "/campaign-execution", label: "Execucao", icon: Activity },
  { href: "/campaign-report", label: "Relatorio", icon: ShieldCheck },
  { href: "/municipal-report", label: "Municipal", icon: MonitorCheck },
  { href: "/municipal-goals", label: "Metas", icon: Target },
  { href: "/mobile", label: "Campo", icon: Smartphone },
  { href: "/data", label: "Dados SUS", icon: Database },
  { href: "/data-import", label: "Importar", icon: FileUp },
  { href: "/data-quality", label: "Qualidade", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersiveRoute = pathname === "/mobile" || pathname === "/comunidade";

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
                GIP Saude Inteligente
              </span>
              <span className="block text-xs text-stone-500">
                Gestao, territorio e dados SUS
              </span>
            </span>
          </Link>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => {
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

          <Link
            href="/campaign-planner"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
          >
            <Sparkles size={16} />
            Sugerir mutirao
          </Link>
        </div>
      </header>
      ) : null}
      {children}
    </div>
  );
}
