"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, TrendingUp } from "lucide-react";
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

  const trendStudent = useMemo(() => data?.students.find((s) => s.studentId === trendStudentId) ?? null, [data, trendStudentId]);
  const trendSeries = useMemo(() => {
    if (!data || !trendStudent) {
      return [];
    }
    return data.examHeaders.map((exam) => ({
      exam: exam.name,
      score: trendStudent.scores[exam.id] ?? null
    }));
  }, [data, trendStudent]);

  async function fetchData() {
    setLoading(true);
    const response = await fetch(`/api/class/${classId}`);
    const result = (await response.json()) as ClassDetail;
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [classId]);

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
          <p className="text-sm text-muted-foreground">单科系统：按姓名自动匹配考生并追加该次考试成绩。</p>
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
        <CardHeader>
          <CardTitle>历次考试班级平均分（柱状图）</CardTitle>
        </CardHeader>
        <CardContent className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.averageByExam}>
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
          <CardTitle>学生成绩表</CardTitle>
          <a href={`/api/export?examId=${data.examHeaders[data.examHeaders.length - 1]?.id ?? ""}`}>
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
                {data.examHeaders.map((exam) => (
                  <TableHead key={exam.id}>{exam.name}</TableHead>
                ))}
                <TableHead>趋势</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>{student.studentName}</TableCell>
                  {data.examHeaders.map((exam) => (
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
            <DialogTitle>{trendStudent?.studentName} 成绩趋势</DialogTitle>
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
