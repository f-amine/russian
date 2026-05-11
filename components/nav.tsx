"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/browse", label: "Browse" },
  { href: "/study", label: "Study" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/listen", label: "Listen" },
  { href: "/plan", label: "Plan" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-primary">RU</span>
          <span className="text-muted-foreground text-sm ml-1">Islands</span>
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
