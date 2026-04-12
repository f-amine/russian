"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function PlanPage() {
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("/action-plan.md")
      .then((r) => r.text())
      .then(setContent);
  }, []);

  if (!content) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">Loading plan...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
