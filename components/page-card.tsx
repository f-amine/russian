import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageCard({
  title,
  subtitle,
  backHref,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm",
        className
      )}
    >
      {(title || backHref || actions) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex w-10 shrink-0">
            {backHref && (
              <Link
                href={backHref}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:text-slate-900"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
          </div>

          <div className="flex-1 text-center">
            {title && (
              <div className="text-xl font-bold tracking-tight text-slate-800">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-xs text-slate-500">{subtitle}</div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>
      )}

      <div
        className={cn(
          "relative flex-1 overflow-y-auto pr-1",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function CardPill({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "amber" | "emerald" | "violet";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
