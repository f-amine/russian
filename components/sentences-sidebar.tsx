"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Home,
  BookOpen,
  Layers,
  FolderOpen,
  User,
  Settings,
  LogOut,
  Library,
  Headphones,
  Brain,
} from "lucide-react";

const learnLinks = [
  { href: "/sentences", label: "Islands", icon: Layers, accent: "bg-blue-500/20 text-blue-300" },
  { href: "/flashcards", label: "Vocabulary Builder", icon: BookOpen, accent: "bg-emerald-500/20 text-emerald-300" },
  { href: "/browse", label: "My Collections", icon: FolderOpen, accent: "bg-amber-500/20 text-amber-300" },
  { href: "/listen", label: "Shadow & Loop", icon: Headphones, accent: "bg-sky-500/20 text-sky-300" },
  { href: "/study", label: "Study Drill", icon: Brain, accent: "bg-violet-500/20 text-violet-300" },
];

const youLinks = [
  { href: "/", label: "Profile", icon: User },
  { href: "/", label: "Settings", icon: Settings },
  { href: "/", label: "Sign out", icon: LogOut },
];

export function SentencesSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-dvh flex-col text-slate-200 transition-[width] duration-300",
        "bg-[radial-gradient(circle_at_20%_0%,#1e2a52_0%,#0f1530_55%,#070a1c_100%)]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
          <Library className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">RU Islands</div>
            <div className="text-[11px] text-slate-400">Sentence-First Method</div>
          </div>
        )}
      </div>

      {/* Learning chip */}
      <div className="px-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-red-500 via-blue-500 to-white text-[10px] font-bold text-slate-900 ring-1 ring-white/20">
            RU
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                Learning
              </div>
              <div className="text-sm font-semibold">Russian</div>
            </div>
          )}
        </div>
      </div>

      {/* Primary nav */}
      <nav className="px-3 pt-5">
        <SidebarLink
          href="/"
          label="Home"
          icon={<Home className="h-[18px] w-[18px]" />}
          active={pathname === "/"}
          collapsed={collapsed}
        />
        <SidebarLink
          href="/plan"
          label="Guide"
          icon={<BookOpen className="h-[18px] w-[18px]" />}
          active={pathname === "/plan"}
          collapsed={collapsed}
        />
      </nav>

      {/* Learn group */}
      <div className="mt-4 px-3">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-slate-400">
            LEARN
          </div>
        )}
        <div className="space-y-1.5">
          {learnLinks.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all",
                  active
                    ? "bg-white/10 shadow-inner shadow-black/20"
                    : "hover:bg-white/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    l.accent
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium text-slate-100">
                    {l.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* You group */}
      <div className="mt-6 px-3">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-slate-400">
            YOU
          </div>
        )}
        <div className="space-y-1">
          {youLinks.map((l, i) => {
            const Icon = l.icon;
            return (
              <button
                key={i}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Icon className="h-[18px] w-[18px] text-slate-400" />
                {!collapsed && <span>{l.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto px-3 pb-5">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-white/10 text-white"
          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <span className="text-slate-400">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
}
