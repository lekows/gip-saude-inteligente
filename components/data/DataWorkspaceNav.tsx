"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Database,
  FileUp,
  LayoutDashboard,
  Map
} from "lucide-react";
import { cn } from "@/lib/utils";

const dataNavItems = [
  {
    href: "/data",
    label: "Visao geral",
    description: "Fluxo e fontes",
    icon: Database
  },
  {
    href: "/data-import",
    label: "Importacao",
    description: "Validar cargas",
    icon: FileUp
  },
  {
    href: "/data-dictionary",
    label: "Dicionario",
    description: "Campos e fontes",
    icon: BookOpen
  },
  {
    href: "/data-quality",
    label: "Qualidade",
    description: "Confianca e governanca",
    icon: ClipboardCheck
  },
  {
    href: "/manager-dashboard",
    label: "Dashboard",
    description: "Indicadores do gestor",
    icon: LayoutDashboard
  },
  {
    href: "/territorial-map",
    label: "Mapa",
    description: "Risco territorial",
    icon: Map
  }
];

export function DataWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-[1500px] px-5 py-4 lg:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BarChart3 size={18} className="text-folha" />
              Ambiente de dados SUS
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Importar, validar, auditar e usar dados agregados no GIP Saude Inteligente.
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {dataNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-[150px] items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                    active
                      ? "border-folha bg-green-50 text-folha"
                      : "border-stone-200 bg-white text-stone-700 hover:border-folha"
                  )}
                >
                  <Icon size={17} />
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-xs opacity-75">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
