import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Section({
  title,
  description,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">{title}</h2>
        {description ? <p className="text-sm text-[var(--muted-foreground)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
