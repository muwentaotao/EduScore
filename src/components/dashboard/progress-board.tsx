"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Medal, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardStudentRow } from "@/lib/types";

type ExamColumn = { id: string; name: string };

function ProgressCell({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus size={12} />
        暂无
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={12} />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
        <ArrowDownRight size={12} />
        {delta}
      </span>
    );
  }
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">0</span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="size-5 text-amber-500" />;
  if (rank === 2) return <Medal className="size-5 text-slate-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-700" />;
  return <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{rank}</span>;
}

type Props = {
  rows: DashboardStudentRow[];
  exams: ExamColumn[];
};

export function ProgressBoard({ rows, exams }: Props) {
  const [tab, setTab] = useState<"improve" | "decline">("improve");

  // rows 服务端已按进步分数降序（null 垫底）
  const improveRows = rows.filter((r) => r.progressDelta === null || r.progressDelta >= 0).slice(0, 20);
  const declineRows = rows
    .filter((r): r is DashboardStudentRow & { progressDelta: number } => r.progressDelta !== null && r.progressDelta < 0)
    .sort((a, b) => a.progressDelta - b.progressDelta)
    .slice(0, 20);

  const visibleRows = tab === "improve" ? improveRows : declineRows;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>{tab === "improve" ? "当前学生进步榜" : "退步预警"}</CardTitle>
          <CardDescription>
            {tab === "improve" ? "按最近两场考试分数差排序" : "最近两场考试分数下降的学生，降序排列"}
          </CardDescription>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setTab("improve")}
            className={`tab-underline pb-1 text-sm font-medium ${tab === "improve" ? "active" : ""}`}
          >
            进步榜
          </button>
          <button
            type="button"
            onClick={() => setTab("decline")}
            className={`tab-underline pb-1 text-sm font-medium ${tab === "decline" ? "active" : ""}`}
          >
            退步预警{declineRows.length > 0 ? `（${declineRows.length}）` : ""}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">排名</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>班级</TableHead>
              {exams.map((exam) => (
                <TableHead key={exam.id}>{exam.name}</TableHead>
              ))}
              <TableHead>分数变化</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row, index) => (
              <TableRow
                key={row.studentId}
                className="row-accent stagger-section"
                style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
              >
                <TableCell>
                  <div className="flex justify-center">
                    <RankBadge rank={index + 1} />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{row.studentName}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${row.classColor}15`,
                      borderColor: `${row.classColor}30`
                    }}
                  >
                    {row.className}
                  </span>
                </TableCell>
                {exams.map((exam) => (
                  <TableCell key={exam.id} className="text-sm">
                    {row.scores[exam.id] ?? "-"}
                  </TableCell>
                ))}
                <TableCell>
                  <ProgressCell delta={row.progressDelta} />
                </TableCell>
              </TableRow>
            ))}
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={exams.length + 4} className="py-8 text-center text-muted-foreground">
                  {tab === "improve" ? "暂无数据" : "最近两场考试没有退步的学生"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
