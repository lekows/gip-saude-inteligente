import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div className={cn("h-3 overflow-hidden rounded-full bg-stone-200", className)}>
      <div
        className={cn("h-full rounded-full bg-folha transition-all", indicatorClassName)}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}
