import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "lms-card flex flex-col gap-1 border-[var(--border)] bg-[var(--card)] p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </span>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-[var(--primary)] opacity-80" aria-hidden />
        ) : null}
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums text-[var(--foreground)]">{value}</div>
      {hint ? <p className="text-xs leading-snug text-[var(--muted-foreground)]">{hint}</p> : null}
    </div>
  );
}
