"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Download, Loader2, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalysisPageData } from "@/lib/types";

function formatDelta(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

type ComparisonMetric = "average" | "passRate" | "excellentRate";

function buildComparisonChartData(data: AnalysisPageData, metric: ComparisonMetric) {
  return data.classComparison.exams.map((exam) => {
    const row: Record<string, string | number> = { exam: exam.name };
    for (const cls of data.classComparison.metrics) {
      const entry = cls.byExam.find((e) => e.examId === exam.id);
      if (entry) row[cls.className] = entry[metric];
    }
    return row;
  });
}

function RankChangeBadge({ currentRank, previousRank }: { currentRank: number; previousRank?: number | null }) {
  if (previousRank === undefined || previousRank === null) return <span className="text-xs text-muted-foreground">-</span>;
  const delta = previousRank - currentRank;
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={10} />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-600">
        <ArrowDownRight size={10} />{delta}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">持平</span>;
}

export function AnalysisClient() {
  const [data, setData] = useState<AnalysisPageData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData(examId?: string) {
    setLoading(true);
    const response = await fetch(`/api/analysis${examId ? `?examId=${examId}` : ""}`, { cache: "no-store" });
    const result = (await response.json()) as AnalysisPageData;
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const currentExam = useMemo(() => data?.exams.find((e) => e.id === data.selectedExamId) ?? null, [data]);
  const previousExam = useMemo(() => {
    if (!data || !currentExam) return null;
    const idx = data.exams.findIndex((e) => e.id === currentExam.id);
    return idx > 0 ? data.exams[idx - 1] : null;
  }, [data, currentExam]);

  const previousRankMap = useMemo(() => {
    if (!previousExam || !data) return new Map<string, number>();
    return new Map(); // placeholder, will compute below
  }, [previousExam, data]);

  if (loading || !data) {
    return (
      <div className="flex h-56 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={16} />
        加载分析数据...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">年级分析</h1>
          <p className="mt-1 text-sm text-muted-foreground">{currentExam?.name} · {currentExam?.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/export?examId=${data.selectedExamId}`}>
              <Download size={16} />
              导出
            </a>
          </Button>
        </div>
      </div>

      {/* Exam tabs */}
      <div className="flex flex-wrap gap-2">
        {data.exams.map((exam) => (
          <Button
            key={exam.id}
            variant={exam.id === data.selectedExamId ? "default" : "outline"}
            size="sm"
            onClick={() => fetchData(exam.id)}
          >
            {exam.name}
          </Button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>班级平均分</CardTitle>
            <CardDescription>各班本次考试平均分对比</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.classAverages}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="className" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="average" radius={[8, 8, 0, 0]} barSize={48}>
                  {data.classAverages.map((entry) => (
                    <Cell key={entry.classId} fill={entry.classColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>分数段分布</CardTitle>
            <CardDescription>全年级学生成绩分段统计</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.distribution.map((_, i) => {
                    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e"];
                    return <Cell key={i} fill={colors[i] ?? "#3b82f6"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>全年级总排名</CardTitle>
          <CardDescription>本次考试全年级学生排名</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">排名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>分数</TableHead>
                <TableHead>名次变化</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rankings.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell className="font-mono text-sm font-semibold">{row.rank}</TableCell>
                  <TableCell className="font-medium">{row.studentName}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${row.classColor}15`, borderColor: `${row.classColor}30` }}
                    >
                      {row.className}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold">{row.score}</TableCell>
                  <TableCell>
                    <RankChangeBadge currentRank={row.rank} />
                  </TableCell>
                </TableRow>
              ))}
              {data.rankings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Improve/Decline */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>进步 TOP5</CardTitle>
            <CardDescription>对比上次考试名次上升最多的学生</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.improveTop5.map((row) => (
              <div key={row.studentId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{row.studentName}</span>
                  <span
                    className="rounded-md border px-1.5 py-0.5 text-xs"
                    style={{ backgroundColor: `${row.classColor}15`, borderColor: `${row.classColor}30` }}
                  >
                    {row.className}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    {row.previousRank} → {row.currentRank}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">+{row.rankDelta}</span>
                  <span className="font-mono text-slate-700">{formatDelta(row.scoreDelta)}</span>
                </div>
              </div>
            ))}
            {data.improveTop5.length === 0 && <p className="text-sm text-muted-foreground">暂无可比较的上次考试数据。</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>退步 TOP5</CardTitle>
            <CardDescription>对比上次考试名次下降最多的学生</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.declineTop5.map((row) => (
              <div key={row.studentId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{row.studentName}</span>
                  <span
                    className="rounded-md border px-1.5 py-0.5 text-xs"
                    style={{ backgroundColor: `${row.classColor}15`, borderColor: `${row.classColor}30` }}
                  >
                    {row.className}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    {row.previousRank} → {row.currentRank}
                  </span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">{row.rankDelta}</span>
                  <span className="font-mono text-slate-700">{formatDelta(row.scoreDelta)}</span>
                </div>
              </div>
            ))}
            {data.declineTop5.length === 0 && <p className="text-sm text-muted-foreground">暂无可比较的上次考试数据。</p>}
          </CardContent>
        </Card>
      </div>

      {/* Class comparison trends */}
      {data.classComparison.exams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">班级横向对比趋势</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>均分趋势</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buildComparisonChartData(data, "average")}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="exam" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                    {data.classComparison.metrics.map((cls) => (
                      <Line
                        key={cls.classId}
                        type="monotone"
                        dataKey={cls.className}
                        stroke={cls.classColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>及格率趋势</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buildComparisonChartData(data, "passRate")}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="exam" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: number | string) => `${v}%`} />
                    {data.classComparison.metrics.map((cls) => (
                      <Line
                        key={cls.classId}
                        type="monotone"
                        dataKey={cls.className}
                        stroke={cls.classColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>优秀率趋势</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buildComparisonChartData(data, "excellentRate")}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="exam" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: number | string) => `${v}%`} />
                    {data.classComparison.metrics.map((cls) => (
                      <Line
                        key={cls.classId}
                        type="monotone"
                        dataKey={cls.className}
                        stroke={cls.classColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
