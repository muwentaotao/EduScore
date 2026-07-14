"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Loader2,
  Minus,
  Pencil,
  Search,
  Trash2,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClassDetail } from "@/lib/types";

type Props = { classId: string };

type ExamStat = {
  avg: number;
  median: number;
  passRate: number;
  excellentRate: number;
  max: number;
  min: number;
};

function toScoreText(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function deltaBadge(delta: number, suffix = "") {
  if (!Number.isFinite(delta) || delta === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={12} />
        {toScoreText(delta)}{suffix}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-600">
      <ArrowDownRight size={12} />
      {toScoreText(Math.abs(delta))}{suffix}
    </span>
  );
}

function scoreTag(score: number | null, isAbsent: boolean) {
  if (isAbsent || score === null) return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">缺考</span>;
  if (score >= 90) return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">优秀</span>;
  if (score >= 70) return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">良好</span>;
  if (score >= 60) return <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">及格</span>;
  return <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">不及格</span>;
}

function getExamStat(data: ClassDetail | null, examId: string | null): ExamStat {
  if (!data || !examId) return { avg: 0, median: 0, passRate: 0, excellentRate: 0, max: 0, min: 0 };
  const scores = data.students
    .map((s) => (s.absentByExam[examId] ? null : s.scores[examId]))
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => a - b);
  if (!scores.length) return { avg: 0, median: 0, passRate: 0, excellentRate: 0, max: 0, min: 0 };
  const total = scores.reduce((a, b) => a + b, 0);
  const mid = Math.floor(scores.length / 2);
  const median = scores.length % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid];
  return {
    avg: total / scores.length,
    median,
    passRate: (scores.filter((s) => s >= 60).length / scores.length) * 100,
    excellentRate: (scores.filter((s) => s >= 90).length / scores.length) * 100,
    max: scores[scores.length - 1],
    min: scores[0]
  };
}

export function ClassDetailClient({ classId }: Props) {
  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendStudentId, setTrendStudentId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  async function fetchData() {
    setLoading(true);
    const response = await fetch(`/api/class/${classId}`, { cache: "no-store" });
    const result = (await response.json()) as ClassDetail;
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [classId]);

  useEffect(() => {
    if (data && !selectedExamId) {
      setSelectedExamId(data.examHeaders.at(-1)?.id ?? "");
    }
  }, [data, selectedExamId]);

  const displayExams = useMemo(() => (data ? data.examHeaders.slice(-6) : []), [data]);
  const selectedExam = useMemo(
    () => data?.examHeaders.find((e) => e.id === selectedExamId) ?? data?.examHeaders.at(-1) ?? null,
    [data, selectedExamId]
  );
  const previousExam = useMemo(() => {
    if (!data || !selectedExam) return null;
    const idx = data.examHeaders.findIndex((e) => e.id === selectedExam.id);
    return idx > 0 ? data.examHeaders[idx - 1] : null;
  }, [data, selectedExam]);

  const latestStat = useMemo(() => getExamStat(data, selectedExam?.id ?? null), [data, selectedExam?.id]);
  const previousStat = useMemo(() => getExamStat(data, previousExam?.id ?? null), [data, previousExam?.id]);

  const distributionData = useMemo(() => {
    if (!data || !selectedExam) return [];
    const buckets = [
      { key: "90-100", min: 90, color: "#10b981" },
      { key: "70-89", min: 70, color: "#3b82f6" },
      { key: "60-69", min: 60, color: "#f59e0b" },
      { key: "<60", min: 0, color: "#f43f5e" }
    ];
    return buckets.map((b, i) => {
      const max = i === 0 ? 100 : buckets[i - 1].min - 0.01;
      const count = data.students.filter((s) => {
        const score = s.absentByExam[selectedExam.id] ? null : s.scores[selectedExam.id];
        return typeof score === "number" && score >= b.min && score <= max;
      }).length;
      return { name: b.key, count, color: b.color };
    });
  }, [data, selectedExam]);

  const studentsForTable = useMemo(() => {
    if (!data) return [];
    return data.students
      .filter((s) => s.studentName.toLowerCase().includes(keyword.trim().toLowerCase()))
      .map((s) => {
        const latestScore = selectedExam?.id ? s.scores[selectedExam.id] : null;
        const numeric = displayExams
          .map((e) => (s.absentByExam[e.id] ? null : s.scores[e.id]))
          .filter((v): v is number => typeof v === "number");
        const trendDelta = numeric.length >= 2 ? numeric[numeric.length - 1] - numeric[numeric.length - 2] : 0;
        return { student: s, latestScore, trendDelta };
      })
      .sort((a, b) => (b.latestScore ?? -1) - (a.latestScore ?? -1));
  }, [data, keyword, selectedExam, displayExams]);

  const trendStudent = useMemo(
    () => data?.students.find((s) => s.studentId === trendStudentId) ?? null,
    [data, trendStudentId]
  );

  const trendSeries = useMemo(() => {
    if (!trendStudent) return [];
    return data!.examHeaders.slice(-10)
      .filter((e) => !trendStudent.absentByExam[e.id])
      .map((e) => ({ exam: e.name, score: trendStudent.scores[e.id] ?? null }))
      .filter((item) => item.score !== null);
  }, [trendStudent, data]);

  async function deleteExam(examId: string, examName: string) {
    if (!window.confirm(`确认删除考试「${examName}」及其所有成绩？`)) return;
    setDeletingExamId(examId);
    await fetch(`/api/exam/${examId}`, { method: "DELETE" });
    setDeletingExamId(null);
    await fetchData();
  }

  if (loading || !data) {
    return (
      <div className="flex h-60 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={16} />
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.classColor }} />
            <h1 className="text-2xl font-bold tracking-tight">{data.className}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{data.students.length} 名学生 · {data.examHeaders.length} 场考试</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="选择考试" />
            </SelectTrigger>
            <SelectContent>
              {data.examHeaders.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}（{e.date}）</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/export?examId=${selectedExam?.id ?? ""}`}>
              <Download size={16} />
              导出
            </a>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground">班级平均分</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold tracking-tight">{toScoreText(latestStat.avg)}</p>
              {deltaBadge(latestStat.avg - previousStat.avg)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">较上次 {previousExam?.name ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground">及格率</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold tracking-tight">{toScoreText(latestStat.passRate)}%</p>
              {deltaBadge(latestStat.passRate - previousStat.passRate, "%")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">≥60 分人数占比</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground">优秀率</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold tracking-tight">{toScoreText(latestStat.excellentRate)}%</p>
              {deltaBadge(latestStat.excellentRate - previousStat.excellentRate, "%")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">≥90 分人数占比</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground">中位数</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold tracking-tight">{toScoreText(latestStat.median)}</p>
              {deltaBadge(latestStat.median - previousStat.median)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">最高分 {latestStat.max} · 最低分 {latestStat.min}</p>
          </CardContent>
        </Card>
      </section>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>均分趋势</CardTitle>
            <CardDescription>最近 10 场考试班级平均分变化</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.averageByExam.slice(-10)}>
                <defs>
                  <linearGradient id="classAvgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={data.classColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={data.classColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="examName" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke={data.classColor}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: data.classColor }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>分数段分布</CardTitle>
            <CardDescription>{selectedExam?.name} 各分数段人数</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distributionData.map((d, i) => (
                    <Cell key={`cell-${i}`} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>学生成绩表</CardTitle>
            <CardDescription>最近 {displayExams.length} 场考试成绩</CardDescription>
          </div>
          <div className="relative w-full sm:w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索学生姓名" className="h-9 pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">排名</TableHead>
                <TableHead>姓名</TableHead>
                {displayExams.map((e) => (
                  <TableHead key={e.id}>{e.name}</TableHead>
                ))}
                <TableHead>状态</TableHead>
                <TableHead>趋势</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsForTable.map((row, index) => (
                <TableRow key={row.student.studentId} className="group">
                  <TableCell className="font-mono text-sm font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{row.student.studentName}</TableCell>
                  {displayExams.map((e) => (
                    <TableCell key={e.id} className="font-mono text-sm">
                      {row.student.absentByExam[e.id] ? "-" : (row.student.scores[e.id] ?? "-")}
                    </TableCell>
                  ))}
                  <TableCell>
                    {scoreTag(
                      selectedExam ? row.student.scores[selectedExam.id] ?? null : null,
                      selectedExam ? row.student.absentByExam[selectedExam.id] ?? false : false
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => setTrendStudentId(row.student.studentId)}
                    >
                      <TrendingUp size={14} />
                      {row.trendDelta > 0 ? `+${row.trendDelta}` : row.trendDelta < 0 ? row.trendDelta : "持平"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {studentsForTable.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    没有匹配的学生
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Exam management */}
      <Card>
        <CardHeader>
          <CardTitle>考试管理</CardTitle>
          <CardDescription>删除某次考试及其成绩</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.examHeaders.map((e) => (
              <Button
                key={e.id}
                variant="outline"
                size="sm"
                onClick={() => deleteExam(e.id, e.name)}
                disabled={deletingExamId === e.id}
              >
                {deletingExamId === e.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                {e.name}
              </Button>
            ))}
            {data.examHeaders.length === 0 && <p className="text-sm text-muted-foreground">暂无考试数据</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(trendStudent)} onOpenChange={(open) => !open && setTrendStudentId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{trendStudent?.studentName} 成绩趋势</DialogTitle>
          </DialogHeader>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="exam" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="score" stroke={data.classColor} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
