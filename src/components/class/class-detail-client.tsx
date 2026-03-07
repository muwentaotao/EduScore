"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Trash2, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreImportForm } from "@/components/class/score-import-form";
import type { ClassDetail } from "@/lib/types";

type Props = { classId: string };

export function ClassDetailClient({ classId }: Props) {
  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendStudentId, setTrendStudentId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);

  const displayExams = useMemo(() => (data ? data.examHeaders.slice(-5) : []), [data]);
  const displayAverages = useMemo(
    () => (data ? data.averageByExam.filter((item) => displayExams.some((exam) => exam.id === item.examId)) : []),
    [data, displayExams]
  );
  const trendStudent = useMemo(
    () => data?.students.find((s) => s.studentId === trendStudentId) ?? null,
    [data, trendStudentId]
  );
  const trendSeries = useMemo(() => {
    if (!trendStudent) {
      return [];
    }
    return displayExams.map((exam) => ({
      exam: exam.name,
      score: trendStudent.scores[exam.id] ?? null
    }));
  }, [displayExams, trendStudent]);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{data.className} 成绩页</h1>
          <p className="text-sm text-muted-foreground">
            单科系统，按姓名自动匹配/创建考生。列表与趋势最多展示最近 5 场考试。
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>导入本次成绩</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreImportForm classId={classId} onImported={fetchData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>考试管理（可删除考试）</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.examHeaders.map((exam) => (
            <Button
              key={exam.id}
              variant="outline"
              onClick={() => deleteExam(exam.id, exam.name)}
              disabled={deletingExamId === exam.id}
            >
              {deletingExamId === exam.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {exam.name}
            </Button>
          ))}
          {data.examHeaders.length === 0 && <p className="text-sm text-muted-foreground">暂无考试数据</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>班级平均分（最近 5 场）</CardTitle>
        </CardHeader>
        <CardContent className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="examName" />
              <YAxis domain={[40, 100]} />
              <Tooltip />
              <Bar dataKey="average" fill={data.classColor} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>学生成绩表（最近 5 场）</CardTitle>
          <a href={`/api/export?examId=${displayExams[displayExams.length - 1]?.id ?? ""}`}>
            <Button variant="outline">
              <Download />
              导出最新考试排名
            </Button>
          </a>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                {displayExams.map((exam) => (
                  <TableHead key={exam.id}>{exam.name}</TableHead>
                ))}
                <TableHead>趋势</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>{student.studentName}</TableCell>
                  {displayExams.map((exam) => (
                    <TableCell key={exam.id}>{student.scores[exam.id] ?? "-"}</TableCell>
                  ))}
                  <TableCell>
                    <Button variant="ghost" onClick={() => setTrendStudentId(student.studentId)}>
                      <TrendingUp />
                      趋势
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(trendStudent)} onOpenChange={(open) => !open && setTrendStudentId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{trendStudent?.studentName} 趋势（最近 5 场）</DialogTitle>
          </DialogHeader>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exam" />
                <YAxis domain={[40, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke={data.classColor} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
