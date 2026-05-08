import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, breadcrumbs, actions, className }: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? <span className="opacity-50">/</span> : null}
              {crumb.to ? (
                <Link to={crumb.to} className="font-medium text-[var(--primary)] no-underline hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[var(--foreground)]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
