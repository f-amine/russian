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
import { loadSentences } from "@/lib/sentences";
import { getProgress } from "@/lib/progress";
import type { Sentence, SentenceProgress } from "@/lib/types";
import { ISLAND_LABELS, ISLANDS } from "@/lib/types";

const PAGE_SIZE = 50;

export default function BrowsePage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [progress, setProgress] = useState<Record<number, SentenceProgress>>({});
  const [search, setSearch] = useState("");
  const [island, setIsland] = useState("all");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadSentences().then(setSentences);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(getProgress());
  }, []);

  const filtered = useMemo(() => {
    return sentences.filter((s) => {
      if (island !== "all" && s.island !== island) return false;
      if (statusFilter !== "all") {
        const p = progress[s.id];
        const status = p?.status || "new";
        if (statusFilter !== status) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          s.russian.toLowerCase().includes(q) ||
          s.english.toLowerCase().includes(q) ||
          s.transliteration.toLowerCase().includes(q) ||
          (s.notes?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [sentences, search, island, statusFilter, progress]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const statusColor = (id: number) => {
    const p = progress[id];
    if (!p) return "outline";
    if (p.status === "mastered") return "default" as const;
    if (p.status === "reviewing") return "secondary" as const;
    return "outline" as const;
  };

  const statusLabel = (id: number) => {
    const p = progress[id];
    if (!p) return "New";
    return p.status.charAt(0).toUpperCase() + p.status.slice(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sentence Islands</h1>
        <p className="text-muted-foreground text-sm">
          {filtered.length} sentences
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <select
          value={island}
          onChange={(e) => {
            setIsland(e.target.value);
            setPage(0);
          }}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">All Islands</option>
          {ISLANDS.map((i) => (
            <option key={i} value={i}>
              {ISLAND_LABELS[i] || i}
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
              <TableHead className="hidden md:table-cell">Transliteration</TableHead>
              <TableHead>English</TableHead>
              <TableHead className="hidden lg:table-cell">Island</TableHead>
              <TableHead className="w-16">Audio</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-muted-foreground text-xs">
                  {s.id}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{s.russian}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {s.transliteration}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{s.english}</div>
                  {s.notes && (
                    <div className="text-xs text-muted-foreground italic">
                      {s.notes}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {ISLAND_LABELS[s.island] || s.island}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AudioPlayer id={s.id} />
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor(s.id)}>
                    {statusLabel(s.id)}
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
