"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Loader2, Minus, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StudentDetail } from "@/lib/types";

type Props = { studentId: string };

export function StudentDetailClient({ studentId }: Props) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<StudentDetail["records"][number] | null>(null);
  const [confirmRecord, setConfirmRecord] = useState<StudentDetail["records"][number] | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editIsAbsent, setEditIsAbsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/students/${studentId}`, { cache: "no-store" });
    const result = (await res.json()) as StudentDetail;
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const latestRecord = data?.records.filter((r) => r.score !== null).at(-1);
  const firstRecord = data?.records.filter((r) => r.score !== null)[0];
  const scoreDelta = latestRecord?.score !== undefined && firstRecord?.score !== undefined ? latestRecord.score - firstRecord.score : null;
  const rankDelta = latestRecord?.rank && firstRecord?.rank ? firstRecord.rank - latestRecord.rank : null;

  function openEdit(record: StudentDetail["records"][number]) {
    setEditScore(record.score !== null ? String(record.score) : "");
    setEditIsAbsent(record.isAbsent);
    setMessage("");
    setEditingRecord(record);
  }

  async function submitEdit() {
    if (!editingRecord) return;
    if (!editIsAbsent && (editScore === "" || Number.isNaN(Number(editScore)))) {
      setMessage("请输入有效分数或勾选缺考");
      return;
    }
    setConfirmRecord(editingRecord);
  }

  async function confirmSave() {
    if (!confirmRecord) return;
    setSaving(true);
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        examId: confirmRecord.examId,
        score: editIsAbsent ? 0 : Number(editScore),
        isAbsent: editIsAbsent
      })
    });
    setSaving(false);
    if (!res.ok) {
      const result = await res.json();
      setMessage(result.message || "保存失败");
      setConfirmRecord(null);
      return;
    }
    setConfirmRecord(null);
    setEditingRecord(null);
    await fetchData();
  }

  function statusTag(score: number | null, isAbsent: boolean) {
    if (isAbsent || score === null) return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">缺考</span>;
    if (score >= 90) return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">优秀</span>;
    if (score >= 70) return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">良好</span>;
    if (score >= 60) return <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">及格</span>;
    return <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">不及格</span>;
  }

  if (loading || !data) {
    return (
      <div className="flex h-60 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={16} />
        加载中...
      </div>
    );
  }

  const rankChartData = data.rankHistory.map((item) => ({
    exam: item.exam,
    rank: item.rank,
    score: item.score,
    classAverage: item.classAverage
  }));

  const comparisonData = data.rankHistory
    .filter((item) => item.score !== null)
    .map((item) => ({
      exam: item.exam,
      myScore: item.score,
      classAverage: item.classAverage
    }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link href="/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} />
          返回学生列表
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left: student profile */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">{data.studentName}</h1>
                <span
                  className="mt-2 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${data.classColor}15`, borderColor: `${data.classColor}30` }}
                >
                  {data.className}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">最新成绩</p>
                  <p className="mt-1 text-2xl font-bold font-mono">{latestRecord?.score ?? "-"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">年级排名</p>
                  <p className="mt-1 text-2xl font-bold font-mono">{latestRecord?.rank ?? "-"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">成绩变化</p>
                  <p className={`mt-1 text-lg font-bold font-mono ${scoreDelta && scoreDelta > 0 ? "text-emerald-600" : scoreDelta && scoreDelta < 0 ? "text-rose-600" : ""}`}>
                    {scoreDelta === null ? "-" : scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">名次变化</p>
                  <p className={`mt-1 text-lg font-bold font-mono ${rankDelta && rankDelta > 0 ? "text-emerald-600" : rankDelta && rankDelta < 0 ? "text-rose-600" : ""}`}>
                    {rankDelta === null ? "-" : rankDelta > 0 ? `+${rankDelta}` : rankDelta}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: charts and table */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>排名变化趋势</CardTitle>
              <CardDescription>Y轴倒序，越靠上名次越高</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rankChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="exam" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: number | null) => [v === null ? "缺考" : `第${v}名`, "排名"]} />
                  <Line type="monotone" dataKey="rank" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>个人成绩 vs 班级均分</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparisonData}>
                  <defs>
                    <linearGradient id="myScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="exam" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Legend />
                  <Area type="monotone" dataKey="myScore" name="个人成绩" stroke="#3b82f6" strokeWidth={2.5} fill="url(#myScoreGrad)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="classAverage" name="班级均分" stroke="#f97316" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>历次成绩汇总</CardTitle>
              <CardDescription>点击编辑可修改单次成绩</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>考试</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>成绩</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>年级排名</TableHead>
                    <TableHead>班级均分</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.records.map((r) => (
                    <TableRow key={r.examId}>
                      <TableCell className="font-medium">{r.examName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.examDate}</TableCell>
                      <TableCell className="font-mono text-lg font-semibold">
                        {r.isAbsent ? <span className="text-muted-foreground">缺考</span> : (r.score ?? "-")}
                      </TableCell>
                      <TableCell>{statusTag(r.score, r.isAbsent)}</TableCell>
                      <TableCell>{r.rank ? `${r.rank} / ${r.totalStudents}` : "-"}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{r.classAverage || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)}>
                          <Pencil size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        暂无考试数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(editingRecord)} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑成绩</DialogTitle>
            <DialogDescription>{editingRecord?.examName} · {data.studentName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>分数</Label>
              <Input type="number" value={editScore} onChange={(e) => setEditScore(e.target.value)} placeholder="输入分数" disabled={editIsAbsent} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editIsAbsent} onChange={(e) => setEditIsAbsent(e.target.checked)} className="size-4 rounded border-slate-300" />
              标记为缺考
            </label>
            {message && <p className="text-sm text-destructive">{message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingRecord(null)}>取消</Button>
            <Button size="sm" onClick={submitEdit}>下一步</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmRecord)} onOpenChange={(open) => !open && setConfirmRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>二次确认</DialogTitle>
            <DialogDescription>
              确认将「{data.studentName}」在「{confirmRecord?.examName}」的成绩修改为：
              <span className="mt-1 block text-lg font-bold">{editIsAbsent ? "缺考" : `${editScore} 分`}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmRecord(null)}>取消</Button>
            <Button size="sm" onClick={confirmSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin" size={16} />}
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
