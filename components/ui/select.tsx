import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-ink shadow-sm focus:border-folha focus:outline-none focus:ring-2 focus:ring-folha/20",
        className
      )}
      {...props}
    />
  );
}
