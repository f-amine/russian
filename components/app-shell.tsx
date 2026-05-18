import { SentencesSidebar } from "@/components/sentences-sidebar";

export function AppShell({
  children,
  rightRail,
}: {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-50/30">
      <SentencesSidebar />
      <main className="flex flex-1 gap-5 overflow-hidden p-5">
        <section className="flex flex-1 flex-col overflow-hidden">
          {children}
        </section>
        {rightRail && (
          <aside className="hidden w-[340px] shrink-0 overflow-y-auto pr-1 xl:block">
            {rightRail}
          </aside>
        )}
      </main>
    </div>
  );
}
