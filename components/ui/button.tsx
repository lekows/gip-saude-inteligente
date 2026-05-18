import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "secondary";

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-folha disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-ink text-white hover:bg-[#28352d]",
        variant === "outline" &&
          "border border-stone-300 bg-white text-ink hover:border-folha",
        variant === "secondary" && "bg-stone-100 text-ink hover:bg-stone-200",
        className
      )}
      {...props}
    />
  );
}
