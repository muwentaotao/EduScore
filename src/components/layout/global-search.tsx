"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SearchResult = {
  id: string;
  name: string;
  className: string;
  classColor: string;
};

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/students?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as SearchResult[];
        setResults(data);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function selectStudent(studentId: string) {
    onOpenChange(false);
    router.push(`/students/${studentId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md top-[15%] translate-y-0">
        <DialogTitle className="sr-only">全局搜索学生</DialogTitle>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入学生姓名搜索..."
              className="pl-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">搜索中...</p>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => selectStudent(student.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: student.classColor }} />
                    <span className="font-medium">{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.className}</span>
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <p className="py-4 text-center text-sm text-muted-foreground">未找到匹配学生</p>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">输入姓名开始搜索</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
