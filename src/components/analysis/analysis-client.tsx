"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalysisPageData } from "@/lib/types";

export function AnalysisClient() {
  const [data, setData] = useState<AnalysisPageData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData(examId?: string) {
    setLoading(true);
    const response = await fetch(`/api/analysis${examId ? `?examId=${examId}` : ""}`);
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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">年级排名分析</h1>
          <CardDescription>支持考试切换、总排名、进退步分析和导出。</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={data.selectedExamId} onValueChange={(value) => fetchData(value)}>
            <SelectTrigger className="w-[220px]">
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
            <Button disabled={!canExport}>
              <Download />
              导出 CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>班级平均分柱状图</CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.classAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis domain={[40, 100]} />
                <Tooltip />
                <Bar dataKey="average" radius={[8, 8, 0, 0]}>
                  {data.classAverages.map((entry) => (
                    <Cell key={entry.classId} fill={entry.className.includes("1") ? "#38bdf8" : entry.className.includes("2") ? "#34d399" : "#fbbf24"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>成绩分布柱状图</CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                <TableRow key={row.studentId} className="transition hover:-translate-y-0.5 hover:shadow-sm">
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.studentName}</TableCell>
                  <TableCell>
                    <span className="rounded-md px-2 py-1 text-xs text-slate-800" style={{ backgroundColor: `${row.classColor}33` }}>
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
        <Card>
          <CardHeader>
            <CardTitle>进步 TOP5（相较上次考试）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.improveTop5.map((row) => (
              <div key={row.studentId} className="rounded-xl bg-emerald-50 p-3 text-sm">
                {row.studentName} · {row.className} · {row.previous} → {row.current}（+{row.delta}）
              </div>
            ))}
            {data.improveTop5.length === 0 && <p className="text-sm text-muted-foreground">暂无可比较的上次考试数据。</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>退步 TOP5（相较上次考试）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.declineTop5.map((row) => (
              <div key={row.studentId} className="rounded-xl bg-rose-50 p-3 text-sm">
                {row.studentName} · {row.className} · {row.previous} → {row.current}（{row.delta}）
              </div>
            ))}
            {data.declineTop5.length === 0 && <p className="text-sm text-muted-foreground">暂无可比较的上次考试数据。</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>每次考试进步最大的五名同学（与上次考试相较）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.examProgressTop5.map((item) => (
            <div key={item.examId} className="rounded-xl border p-3">
              <p className="mb-2 text-sm font-semibold">
                {item.examName}（对比 {item.previousExamName}）
              </p>
              {item.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">无可比较数据</p>
              ) : (
                <div className="space-y-2">
                  {item.rows.map((row, index) => (
                    <div key={row.studentId} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-md bg-sky-100 px-2 py-0.5 text-sky-700">TOP {index + 1}</span>
                      <span>{row.studentName}</span>
                      <span className="rounded-md px-2 py-0.5" style={{ backgroundColor: `${row.classColor}33` }}>
                        {row.className}
                      </span>
                      <span className="text-muted-foreground">
                        {row.previous} → {row.current}
                      </span>
                      <span className="font-semibold text-emerald-700">+{row.delta}</span>
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
