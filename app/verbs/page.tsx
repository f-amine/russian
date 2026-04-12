"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AudioPlayer } from "@/components/audio-player";
import { loadVerbs } from "@/lib/verbs";
import { getProgress } from "@/lib/progress";
import type { Verb, VerbProgress } from "@/lib/types";

const CATEGORIES = [
  "all",
  "action",
  "communication",
  "cognition",
  "emotion",
  "motion",
  "social",
  "state",
  "change",
  "creation",
  "possession",
  "perception",
  "existence",
];

const PAGE_SIZE = 50;

export default function VerbsPage() {
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [progress, setProgress] = useState<Record<number, VerbProgress>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadVerbs().then(setVerbs);
    setProgress(getProgress());
  }, []);

  const filtered = useMemo(() => {
    return verbs.filter((v) => {
      if (category !== "all" && v.category !== category) return false;
      if (statusFilter !== "all") {
        const p = progress[v.rank];
        const status = p?.status || "new";
        if (statusFilter !== status) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          v.russian_verb.toLowerCase().includes(q) ||
          v.english_verb.toLowerCase().includes(q) ||
          v.transliteration.toLowerCase().includes(q) ||
          v.russian_sentence.toLowerCase().includes(q) ||
          v.english_sentence.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [verbs, search, category, statusFilter, progress]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const statusColor = (rank: number) => {
    const p = progress[rank];
    if (!p) return "outline";
    if (p.status === "mastered") return "default" as const;
    if (p.status === "reviewing") return "secondary" as const;
    return "outline" as const;
  };

  const statusLabel = (rank: number) => {
    const p = progress[rank];
    if (!p) return "New";
    return p.status.charAt(0).toUpperCase() + p.status.slice(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Russian Verbs</h1>
        <p className="text-muted-foreground text-sm">
          {filtered.length} verbs found
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search verbs..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="reviewing">Reviewing</option>
          <option value="mastered">Mastered</option>
        </select>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Russian</TableHead>
              <TableHead>English</TableHead>
              <TableHead className="hidden md:table-cell">
                Example Sentence
              </TableHead>
              <TableHead className="w-16">Audio</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((v) => (
              <TableRow key={v.rank}>
                <TableCell className="text-muted-foreground text-xs">
                  {v.rank}
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{v.russian_verb}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.transliteration}
                  </div>
                </TableCell>
                <TableCell>{v.english_verb}</TableCell>
                <TableCell className="hidden md:table-cell max-w-md">
                  <div className="text-sm">{v.russian_sentence}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.english_sentence}
                  </div>
                </TableCell>
                <TableCell>
                  <AudioPlayer rank={v.rank} />
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor(v.rank)}>
                    {statusLabel(v.rank)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
