"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Loader2,
  Medal,
  PieChart,
  Search,
  Trash2,
  TrendingUp,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreImportForm } from "@/components/class/score-import-form";
import type { ClassDetail } from "@/lib/types";

type Props = { classId: string };

type ExamStat = {
  avg: number;
  max: number;
  min: number;
  excellentRate: number;
  topStudentName: string;
};

function toScoreText(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function deltaBadge(delta: number, suffix = "") {
  if (!Number.isFinite(delta)) {
    return <span className="text-muted-foreground">-</span>;
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
        <ArrowUpRight size={14} />
        {toScoreText(delta)}
        {suffix}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
        <ArrowDownRight size={14} />
        {toScoreText(Math.abs(delta))}
        {suffix}
      </span>
    );
  }
  return <span className="font-semibold text-muted-foreground">0{suffix}</span>;
}

function getExamStat(data: ClassDetail | null, examId: string | null): ExamStat {
  if (!data || !examId) {
    return { avg: 0, max: 0, min: 0, excellentRate: 0, topStudentName: "-" };
  }

  const rows = data.students
    .map((student) => ({
      name: student.studentName,
      score: student.absentByExam[examId] ? null : student.scores[examId]
    }))
    .filter((item): item is { name: string; score: number } => typeof item.score === "number");

  if (!rows.length) {
    return { avg: 0, max: 0, min: 0, excellentRate: 0, topStudentName: "-" };
  }

  const total = rows.reduce((sum, item) => sum + item.score, 0);
  const avg = total / rows.length;
  const max = Math.max(...rows.map((item) => item.score));
  const min = Math.min(...rows.map((item) => item.score));
  const excellentCount = rows.filter((item) => item.score >= 90).length;
  const topStudent = rows.find((item) => item.score === max);

  return {
    avg,
    max,
    min,
    excellentRate: (excellentCount / rows.length) * 100,
    topStudentName: topStudent?.name ?? "-"
  };
}

export function ClassDetailClient({ classId }: Props) {
  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendStudentId, setTrendStudentId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  const averageExams = useMemo(() => (data ? data.examHeaders.slice(-10) : []), [data]);
  const displayExams = useMemo(() => (data ? data.examHeaders.slice(-6) : []), [data]);
  const displayAverages = useMemo(
    () => (data ? data.averageByExam.filter((item) => averageExams.some((exam) => exam.id === item.examId)) : []),
    [data, averageExams]
  );

  const selectedExam = useMemo(
    () => data?.examHeaders.find((exam) => exam.id === selectedExamId) ?? data?.examHeaders.at(-1) ?? null,
    [data, selectedExamId]
  );
  const previousExam = useMemo(() => {
    if (!data || !selectedExam) {
      return null;
    }
    const selectedIndex = data.examHeaders.findIndex((exam) => exam.id === selectedExam.id);
    return selectedIndex > 0 ? data.examHeaders[selectedIndex - 1] : null;
  }, [data, selectedExam]);

  const trendStudent = useMemo(
    () => data?.students.find((s) => s.studentId === trendStudentId) ?? null,
    [data, trendStudentId]
  );

  const trendSeries = useMemo(() => {
    if (!trendStudent) {
      return [];
    }
    return averageExams
      .filter((exam) => !trendStudent.absentByExam[exam.id])
      .map((exam) => ({
        exam: exam.name,
        score: trendStudent.scores[exam.id] ?? null
      }))
      .filter((item) => item.score !== null);
  }, [averageExams, trendStudent]);

  const latestStat = useMemo(() => getExamStat(data, selectedExam?.id ?? null), [data, selectedExam?.id]);
  const previousStat = useMemo(() => getExamStat(data, previousExam?.id ?? null), [data, previousExam?.id]);

  const studentsForTable = useMemo(() => {
    if (!data) {
      return [];
    }

    const list = data.students
      .filter((student) => student.studentName.toLowerCase().includes(keyword.trim().toLowerCase()))
      .map((student) => {
        const latestScore = selectedExam?.id ? student.scores[selectedExam.id] : null;

        const numeric = displayExams
          .map((exam) => (student.absentByExam[exam.id] ? null : student.scores[exam.id]))
          .filter((item): item is number => typeof item === "number");

        const trendDelta = numeric.length >= 2 ? numeric[numeric.length - 1] - numeric[numeric.length - 2] : 0;

        return {
          student,
          latestScore: typeof latestScore === "number" ? latestScore : -1,
          trendDelta
        };
      })
      .sort((a, b) => b.latestScore - a.latestScore);

    return list;
  }, [data, keyword, selectedExam, displayExams]);

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
    if (!data) {
      return;
    }
    const exists = data.examHeaders.some((exam) => exam.id === selectedExamId);
    if (!selectedExamId || !exists) {
      setSelectedExamId(data.examHeaders.at(-1)?.id ?? "");
    }
  }, [data, selectedExamId]);

  async function deleteExam(examId: string, examName: string) {
    const ok = window.confirm(`确认删除考试“${examName}”及其所有成绩？`);
    if (!ok) {
      return;
    }
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{data.className} · <span className="text-primary">成绩分析</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">单科系统，按姓名自动匹配/创建考生。列表与趋势最多展示最近 10 场考试。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger className="h-11 w-[240px] border-slate-200 bg-white/90">
              <SelectValue placeholder="选择考试查看统计" />
            </SelectTrigger>
            <SelectContent>
              {data.examHeaders.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}（{exam.date}）
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <a href="#import-section">
            <Button className="h-11 px-5">导入成绩</Button>
          </a>
        </div>
      </div>

      <Card id="import-section" className="border-slate-200/80 bg-white/90">
        <CardContent className="pt-5">
          <ScoreImportForm
            classId={classId}
            examNameOptions={data.examHeaders.map((exam) => exam.name)}
            onImported={fetchData}
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="rounded-2xl bg-blue-500 p-3 text-white">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">班级平均分</p>
              <p className="text-5xl font-bold leading-none">{toScoreText(latestStat.avg)}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {selectedExam ? `考试：${selectedExam.name}` : "暂无考试"} · 较上次 {deltaBadge(latestStat.avg - previousStat.avg)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="rounded-2xl bg-emerald-500 p-3 text-white">
              <Trophy size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">最高分</p>
              <p className="text-5xl font-bold leading-none">{toScoreText(latestStat.max)}</p>
              <p className="mt-3 text-sm text-muted-foreground">最高分学生：{latestStat.topStudentName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="rounded-2xl bg-amber-500 p-3 text-white">
              <Medal size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">最低分</p>
              <p className="text-5xl font-bold leading-none">{toScoreText(latestStat.min)}</p>
              <p className="mt-3 text-sm text-muted-foreground">较上次 {deltaBadge(latestStat.min - previousStat.min)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="rounded-2xl bg-violet-500 p-3 text-white">
              <PieChart size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">优秀率（≥90分）</p>
              <p className="text-5xl font-bold leading-none">{toScoreText(latestStat.excellentRate)}%</p>
              <p className="mt-3 text-sm text-muted-foreground">
                较上次 {deltaBadge(latestStat.excellentRate - previousStat.excellentRate, "%")}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>班级平均分趋势（最近 10 场）</CardTitle>
          <Button variant="outline">查看更多</Button>
        </CardHeader>
        <CardContent className="h-[290px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="examName" />
              <YAxis domain={[40, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="average" name="平均分" fill="#5fa6ff" radius={[8, 8, 0, 0]} barSize={48} />
              <Line type="monotone" dataKey="average" name="趋势线" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>学生成绩表（最近 6 场）</CardTitle>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <div className="relative w-full sm:w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索学生姓名" className="h-10 pl-9" />
            </div>
            <a href={`/api/export?examId=${selectedExam?.id ?? ""}`}>
              <Button variant="outline" className="h-10">
                <Download />
                导出表格
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>姓名</TableHead>
                {displayExams.map((exam) => (
                  <TableHead key={exam.id}>{exam.name}</TableHead>
                ))}
                <TableHead>趋势</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsForTable.map((row, index) => {
                const trendLabel = row.trendDelta > 0 ? "上升" : row.trendDelta < 0 ? "下降" : "持平";
                const trendClass = row.trendDelta > 0 ? "text-emerald-600" : row.trendDelta < 0 ? "text-rose-600" : "text-muted-foreground";

                return (
                  <TableRow key={row.student.studentId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{row.student.studentName}</TableCell>
                    {displayExams.map((exam) => (
                      <TableCell key={exam.id}>
                        {row.student.absentByExam[exam.id] ? "缺考" : (row.student.scores[exam.id] ?? "-")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" className={`h-8 px-2 ${trendClass}`} onClick={() => setTrendStudentId(row.student.studentId)}>
                        <TrendingUp className="size-4" />
                        {trendLabel}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {studentsForTable.length === 0 && <p className="pt-4 text-sm text-muted-foreground">没有匹配的学生。</p>}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>考试管理</CardTitle>
          <CardDescription>可直接删除某次考试及其成绩。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.examHeaders.map((exam) => (
            <Button
              key={exam.id}
              variant="outline"
              className="h-9"
              onClick={() => deleteExam(exam.id, exam.name)}
              disabled={deletingExamId === exam.id}
            >
              {deletingExamId === exam.id ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4" />}
              {exam.name}
            </Button>
          ))}
          {data.examHeaders.length === 0 && <p className="text-sm text-muted-foreground">暂无考试数据</p>}
        </CardContent>
      </Card>

      <Dialog open={Boolean(trendStudent)} onOpenChange={(open) => !open && setTrendStudentId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{trendStudent?.studentName} 成绩趋势（最近 10 场）</DialogTitle>
          </DialogHeader>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exam" />
                <YAxis domain={[40, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
