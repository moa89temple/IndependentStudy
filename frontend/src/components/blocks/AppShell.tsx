import { Link, useLocation } from "react-router-dom";
import { BookOpen, LayoutDashboard, Moon, SunMedium, BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, analytics: "nav-dashboard" },
  { to: "/admin", label: "Analytics", icon: BarChart3, analytics: "nav-admin" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--header-bg)]/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              data-analytics="nav-brand"
              className="flex items-center gap-2 font-semibold tracking-tight text-[var(--foreground)] no-underline hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                <BookOpen className="h-5 w-5" aria-hidden />
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-bold sm:text-base">Lizard</span>
                <span className="text-[10px] font-medium text-[var(--muted-foreground)] sm:text-xs">
                  AI study workspace
                </span>
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map(({ to, label, icon: Icon, analytics }) => {
              const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  data-analytics={analytics}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors",
                    active
                      ? "bg-[var(--muted)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60 hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              data-analytics="nav-theme-toggle"
            >
              {theme === "dark" ? (
                <SunMedium className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {nav.map(({ to, label, icon: Icon, analytics }) => {
                const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    data-analytics={analytics}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium no-underline",
                      active
                        ? "bg-[var(--muted)] text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--border)] bg-[var(--card)] py-6 text-center text-xs text-[var(--muted-foreground)]">
        <p className="mx-auto max-w-6xl px-4">
          Upload materials, extract concepts with AI, and study with flashcards and practice questions.
        </p>
      </footer>
    </div>
  );
}
