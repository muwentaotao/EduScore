"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalysisPageData } from "@/lib/types";

function formatDelta(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function AnalysisClient() {
  const [data, setData] = useState<AnalysisPageData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData(examId?: string) {
    setLoading(true);
    const response = await fetch(`/api/analysis${examId ? `?examId=${examId}` : ""}`, {
      cache: "no-store"
    });
    const result = (await response.json()) as AnalysisPageData;
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const canExport = useMemo(() => Boolean(data?.selectedExamId), [data?.selectedExamId]);

  if (loading || !data) {
    return (
      <div className="flex h-56 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={16} />
        加载分析数据...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            年级排名 · <span className="text-primary">成绩分析</span>
          </h1>
          <CardDescription className="mt-2">支持考试切换、总排名、进退步分析与导出。</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={data.selectedExamId} onValueChange={(value) => fetchData(value)}>
            <SelectTrigger className="h-11 w-[230px] border-slate-200 bg-white/90">
              <SelectValue placeholder="选择考试" />
            </SelectTrigger>
            <SelectContent>
              {data.exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}（{exam.date}）
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <a href={`/api/export?examId=${data.selectedExamId}`}>
            <Button disabled={!canExport} className="h-11 px-5">
              <Download />
              导出 CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle>班级平均分</CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.classAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis domain={[40, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" name="平均分" radius={[8, 8, 0, 0]}>
                  {data.classAverages.map((entry) => (
                    <Cell key={entry.classId} fill={entry.classColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle>分数段分布</CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="人数" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>全年级总排名</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>分数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rankings.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.studentName}</TableCell>
                  <TableCell>
                    <span
                      className="rounded-md border px-2 py-1 text-xs"
                      style={{
                        backgroundColor: `${row.classColor}22`,
                        borderColor: `${row.classColor}66`
                      }}
                    >
                      {row.className}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">{row.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle>进步 TOP5（按名次）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.improveTop5.map((row) => (
              <div key={row.studentId} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                {row.studentName} ·{" "}
                <span
                  className="rounded-md border px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: `${row.classColor}22`,
                    borderColor: `${row.classColor}66`
                  }}
                >
                  {row.className}
                </span>{" "}
                · 名次 {row.previousRank} → {row.currentRank}（+{row.rankDelta}） · 分数 {row.previousScore} → {row.currentScore}（{formatDelta(row.scoreDelta)}）
              </div>
            ))}
            {data.improveTop5.length === 0 && <p className="text-sm text-muted-foreground">暂无可比较的上次考试数据。</p>}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle>退步 TOP5（按名次）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.declineTop5.map((row) => (
              <div key={row.studentId} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                {row.studentName} ·{" "}
                <span
                  className="rounded-md border px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: `${row.classColor}22`,
                    borderColor: `${row.classColor}66`
                  }}
                >
                  {row.className}
                </span>{" "}
                · 名次 {row.previousRank} → {row.currentRank}（{row.rankDelta}） · 分数 {row.previousScore} → {row.currentScore}（{formatDelta(row.scoreDelta)}）
              </div>
            ))}
            {data.declineTop5.length === 0 && <p className="text-sm text-muted-foreground">暂无可比较的上次考试数据。</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>每次考试进步 TOP5（按名次）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.examProgressTop5.map((item) => (
            <div key={item.examId} className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold">
                {item.examName}（对比 {item.previousExamName}）
              </p>
              {item.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">无可比较数据</p>
              ) : (
                <div className="space-y-2">
                  {item.rows.map((row, index) => (
                    <div key={row.studentId} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">TOP {index + 1}</span>
                      <span>{row.studentName}</span>
                      <span className="rounded-md border border-slate-200 px-2 py-0.5">{row.className}</span>
                      <span className="text-muted-foreground">
                        名次 {row.previousRank} → {row.currentRank} · 分数 {row.previousScore} → {row.currentScore}
                      </span>
                      <span className="font-semibold text-emerald-600">+{row.rankDelta}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {data.examProgressTop5.length === 0 && <p className="text-sm text-muted-foreground">至少需要两次考试后才会显示。</p>}
        </CardContent>
      </Card>
    </div>
  );
}
