"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageCard } from "@/components/page-card";

export default function PlanPage() {
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("/action-plan.md")
      .then((r) => r.text())
      .then(setContent);
  }, []);

  return (
    <div className="flex h-full w-full">
      <PageCard backHref="/" title="Action Plan" subtitle="Roadmap & method">
        {content ? (
          <article className="markdown-content mx-auto max-w-3xl px-2 pb-6 text-slate-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            Loading plan…
          </div>
        )}
      </PageCard>
    </div>
  );
}
