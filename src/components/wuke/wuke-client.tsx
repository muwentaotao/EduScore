"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  Download,
  Loader2,
  Minus,
  Trash2,
  TrendingDown,
  Upload,
  Users
} from "lucide-react";
import type { ExamType, Subject } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SUBJECT_COLORS, SUBJECT_LABELS, SUBJECT_ORDER, EXAM_TYPE_LABELS, EXAM_TYPE_ORDER, examTypeLabel } from "@/lib/subject";
import { toFixed } from "@/lib/utils";
import type {
  WukePageData,
  WukeStudentRow,
  WukeStudentHistory,
  WukeComparisonData,
  WukeWarningRow
} from "@/lib/types";
import Link from "next/link";

type Tab = "report" | "comparison" | "warnings";

function formatScore(value: number | null): string {
  if (value === null) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function scoreCellColor(score: number | null, isAbsent: boolean): string {
  if (isAbsent || score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 font-semibold";
  if (score >= 60) return "text-foreground";
  return "text-rose-600 font-semibold";
}

function deltaBadge(delta: number | null) {
  if (delta === null || delta === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={12} />+{formatScore(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-600">
      <ArrowDownRight size={12} />{formatScore(Math.abs(delta))}
    </span>
  );
}

function rankDeltaBadge(rankDelta: number | null) {
  if (rankDelta === null || rankDelta === 0) {
    return <span className="text-xs text-muted-foreground">持平</span>;
  }
  if (rankDelta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={10} />+{rankDelta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-600">
      <ArrowDownRight size={10} />{rankDelta}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Award className="size-5 text-amber-500" />;
  if (rank === 2) return <Award className="size-5 text-slate-400" />;
  if (rank === 3) return <Award className="size-5 text-amber-700" />;
  return <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{rank}</span>;
}

function WarningBadge({ type }: { type: WukeWarningRow["warnings"][number] }) {
  const map: Record<string, { label: string; className: string }> = {
    rankDropLarge: { label: "名次骤降", className: "bg-rose-100 text-rose-700" },
    rankDropConsecutive: { label: "连续下滑", className: "bg-orange-100 text-orange-700" }
  };
  const info = map[type];
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${info.className}`}>{info.label}</span>;
}

function ImportDialog({ open, onOpenChange, onImported }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => Promise<void> | void;
}) {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examType, setExamType] = useState<ExamType>("MONTHLY");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  async function onImport() {
    if (!file || !examName.trim() || !examDate) {
      setMessage("请填写考试名称、考试日期并上传成绩文件");
      return;
    }
    setImporting(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("examName", examName.trim());
    formData.append("examDate", examDate);
    formData.append("examType", examType);
    const response = await fetch("/api/wuke/import", { method: "POST", body: formData });
    const result = await response.json();
    setMessage(result.message || "导入完成");
    setImporting(false);
    setFile(null);
    setExamName("");
    setExamDate("");
    if (response.ok) {
      await onImported();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入五科成绩</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Excel 表头需包含：班级、姓名，以及五科成绩列（语文、数学、英语、科学、社会）。
            缺考、空白或 0 分将自动标记为缺考。
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">考试名称</Label>
            <Input
              placeholder="例如：九年级下第一次月考"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">考试日期</Label>
            <div className="relative">
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="h-9 pr-8" />
              <Calendar className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">考试类型</Label>
            <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPE_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>{EXAM_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">成绩文件（首行为表头）</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="h-9"
            />
          </div>
          <Button onClick={onImport} disabled={importing} className="w-full">
            {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            导入
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type RadarTab = "radar" | "trend" | "comparison" | "recommend";

function RadarDialog({ student, open, onOpenChange }: {
  student: WukeStudentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [subTab, setSubTab] = useState<RadarTab>("radar");
  const [history, setHistory] = useState<WukeStudentHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!open || !student) {
      setHistory(null);
      setSubTab("radar");
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    fetch(`/api/wuke/student?studentId=${student.studentId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WukeStudentHistory | null) => {
        if (!cancelled) setHistory(data);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, student]);

  const radarData = useMemo(() => {
    if (!student) return [];
    return SUBJECT_ORDER.map((subject) => ({
      subject: SUBJECT_LABELS[subject],
      score: student.subjects[subject].isAbsent || student.subjects[subject].score === null
        ? 0
        : student.subjects[subject].score as number,
      classAvg:
        history && history.points.length > 0
          ? history.points[history.points.length - 1].subjects[subject].classAverage
          : 0,
      isAbsent: student.subjects[subject].isAbsent
    }));
  }, [student, history]);

  const trendData = useMemo(() => {
    if (!history || history.points.length === 0) return [];
    return history.points.map((p) => {
      const row: Record<string, number | string | null> = {
        name: p.examName
      };
      for (const subject of SUBJECT_ORDER) {
        row[subject] = p.subjects[subject].score;
      }
      return row;
    });
  }, [history]);

  const comparisonData = useMemo(() => {
    if (!history || history.points.length === 0) return [];
    return history.points.map((p) => {
      const row: Record<string, number | string | null> = {
        name: p.examName
      };
      for (const subject of SUBJECT_ORDER) {
        const cell = p.subjects[subject];
        row[`${subject}_score`] = cell.score;
        row[`${subject}_avg`] = toFixed(cell.classAverage);
        row[`${subject}_gap`] = cell.score !== null ? toFixed(cell.score - cell.classAverage) : null;
      }
      return row;
    });
  }, [history]);

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{student.studentName} · 偏科分析</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-0 border-b border-border">
          {(items => items.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`tab-underline px-3 py-2 text-sm font-medium ${subTab === tab.key ? "active" : ""}`}
            >
              {tab.label}
            </button>
          )))([
            { key: "radar" as const, label: "偏科雷达" },
            { key: "trend" as const, label: "历次偏科趋势" },
            { key: "comparison" as const, label: "与班级均分对比" },
            { key: "recommend" as const, label: "偏科科目推荐" }
          ])}
        </div>

        {subTab === "radar" && (
          <div className="space-y-3">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={90}>
                  <PolarGrid stroke="#e4ddd5" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="个人" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                  {radarData.some((d) => d.classAvg > 0) && (
                    <Radar name="班级均分" dataKey="classAvg" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={2} />
                  )}
                  <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e4ddd5" }} />
                  {radarData.some((d) => d.classAvg > 0) && <Legend />}
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {SUBJECT_ORDER.map((subject) => {
                const cell = student.subjects[subject];
                const classAvg = history && history.points.length > 0
                  ? history.points[history.points.length - 1].subjects[subject].classAverage
                  : null;
                const isMax = !cell.isAbsent && cell.score !== null && cell.score === Math.max(
                  ...SUBJECT_ORDER.map((s) => student.subjects[s].isAbsent || student.subjects[s].score === null ? -1 : student.subjects[s].score as number)
                );
                const isMin = !cell.isAbsent && cell.score !== null && cell.score === Math.min(
                  ...SUBJECT_ORDER.map((s) => student.subjects[s].isAbsent || student.subjects[s].score === null ? Infinity : student.subjects[s].score as number)
                );
                return (
                  <div key={subject} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                    <span className="font-medium" style={{ color: SUBJECT_COLORS[subject] }}>{SUBJECT_LABELS[subject]}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{cell.isAbsent ? "缺考" : formatScore(cell.score)}</span>
                      {classAvg !== null && (
                        <span className="text-xs text-muted-foreground">班均 {formatScore(classAvg)}</span>
                      )}
                      {isMax && !cell.isAbsent && <span className="text-xs text-emerald-600">优势</span>}
                      {isMin && !cell.isAbsent && <span className="text-xs text-rose-600">薄弱</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {subTab === "trend" && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 animate-spin" size={16} />
                加载历次数据...
              </div>
            ) : trendData.length < 2 ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                至少需要 2 次考试数据才能展示趋势
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SUBJECT_ORDER.map((subject) => {
                  const scores = trendData.map((d) => d[subject] as number | null).filter((s) => s !== null) as number[];
                  const min = scores.length > 0 ? Math.floor(Math.min(...scores) / 10) * 10 : 0;
                  const max = scores.length > 0 ? Math.ceil(Math.max(...scores) / 10) * 10 : 100;
                  const domainMin = Math.max(0, min - 5);
                  const domainMax = max + 5;
                  return (
                    <div key={subject} className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: SUBJECT_COLORS[subject] }}>
                          {SUBJECT_LABELS[subject]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          最高 {formatScore(Math.max(...scores))} / 最低 {formatScore(Math.min(...scores))}
                        </span>
                      </div>
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ede8e0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis domain={[domainMin, domainMax]} tick={{ fontSize: 10 }} width={30} />
                            <Tooltip
                              contentStyle={{ borderRadius: 4, border: "1px solid #e4ddd5", fontSize: 12 }}
                              formatter={(value: number) => [formatScore(value), SUBJECT_LABELS[subject]]}
                            />
                            <Line
                              type="monotone"
                              dataKey={subject}
                              stroke={SUBJECT_COLORS[subject]}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: SUBJECT_COLORS[subject], strokeWidth: 0 }}
                              activeDot={{ r: 6, fill: SUBJECT_COLORS[subject], strokeWidth: 2, stroke: "#fff" }}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              每个科目独立展示历次成绩走势，纵轴自适应缩放以便观察变化细节。
            </p>
          </div>
        )}

        {subTab === "comparison" && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 animate-spin" size={16} />
                加载历次数据...
              </div>
            ) : comparisonData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                暂无对比数据
              </div>
            ) : (
              <div className="space-y-4">
                {/* Latest exam: grouped bar chart */}
                {(() => {
                  const last = history!.points.at(-1)!;
                  const barData = SUBJECT_ORDER.map((subject) => {
                    const cell = last.subjects[subject];
                    return {
                      subject: SUBJECT_LABELS[subject],
                      subjectKey: subject,
                      个人: cell.isAbsent ? null : cell.score,
                      班均: toFixed(cell.classAverage),
                      差距: cell.score !== null ? toFixed(cell.score - cell.classAverage) : null
                    };
                  });
                  return (
                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">
                        最新考试：<span className="font-semibold">{last.examName}</span>
                      </p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ede8e0" vertical={false} />
                            <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ borderRadius: 4, border: "1px solid #e4ddd5", fontSize: 12 }}
                            />
                            <Legend iconType="rect" />
                            <Bar dataKey="个人" radius={[4, 4, 0, 0]} barSize={20}>
                              {barData.map((entry, idx) => (
                                <Cell key={idx} fill={SUBJECT_COLORS[entry.subjectKey]} fillOpacity={0.85} />
                              ))}
                            </Bar>
                            <Bar dataKey="班均" radius={[4, 4, 0, 0]} barSize={20}>
                              {barData.map((entry, idx) => (
                                <Cell key={idx} fill={SUBJECT_COLORS[entry.subjectKey]} fillOpacity={0.25} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}

                {/* Gap trend line chart */}
                {history!.points.length >= 2 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">差值趋势（个人-班均）</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparisonData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 4, border: "1px solid #e4ddd5", fontSize: 12 }}
                            formatter={(value: number) => [formatScore(value), "差值"]}
                          />
                          <Legend />
                          {SUBJECT_ORDER.map((subject) => {
                            const gapData = comparisonData.map((d) => {
                              const score = d[`${subject}_score`] as number | null;
                              const avg = d[`${subject}_avg`] as number | null;
                              if (score === null || avg === null) return null;
                              return toFixed(score - avg);
                            });
                            const hasData = gapData.some((d) => d !== null);
                            if (!hasData) return null;
                            return (
                              <Line
                                key={subject}
                                type="monotone"
                                dataKey={`${subject}_gap`}
                                name={SUBJECT_LABELS[subject]}
                                stroke={SUBJECT_COLORS[subject]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                connectNulls
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Summary table */}
                <div className="space-y-1.5">
                  {SUBJECT_ORDER.map((subject) => {
                    const last = history?.points.at(-1);
                    if (!last) return null;
                    const cell = last.subjects[subject];
                    const diff = cell.score !== null ? toFixed(cell.score - cell.classAverage) : null;
                    return (
                      <div key={subject} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                        <span className="font-medium" style={{ color: SUBJECT_COLORS[subject] }}>{SUBJECT_LABELS[subject]}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            个人 {cell.isAbsent ? "缺考" : formatScore(cell.score)} / 班均 {formatScore(cell.classAverage)}
                          </span>
                          {diff !== null && (
                            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {diff >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {diff >= 0 ? "+" : ""}{formatScore(diff)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  柱状图展示最近一次考试的个人 vs 班均对比；折线图展示历次差值变化（正值为超均，负值为低于均分）。
                </p>
              </div>
            )}
          </div>
        )}

        {subTab === "recommend" && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 animate-spin" size={16} />
                加载推荐数据...
              </div>
            ) : !history || history.recommendations.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                暂无足够数据生成推荐
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  按平均「个人 - 班均」差距排序，差距越小（越接近 0 或负越多）说明相对班级越偏弱。建议优先补齐前三科。
                </div>
                {history.recommendations.map((rec, idx) => {
                  const isWeak = rec.avgGap < 0;
                  const isStrong = rec.avgGap > 0;
                  return (
                    <div key={rec.subject} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                          idx < 3 ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium" style={{ color: SUBJECT_COLORS[rec.subject] }}>
                          {SUBJECT_LABELS[rec.subject]}
                        </span>
                        <span className="text-xs text-muted-foreground">参考 {rec.attendedCount} 次</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isWeak ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                            <AlertTriangle size={12} />建议补强
                          </span>
                        ) : isStrong ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                            <ArrowUpRight size={12} />优势科目
                          </span>
                        ) : null}
                        <span className="font-mono text-xs text-muted-foreground">
                          均差 {rec.avgGap >= 0 ? "+" : ""}{formatScore(rec.avgGap)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {history && history.points.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-foreground">历次班级排名</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {history.points.map((p) => (
                    <span key={p.examId} className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-xs">
                      <span className="text-muted-foreground">{p.examName}</span>
                      <span className="font-mono font-semibold">
                        {p.classRank !== null ? `#${p.classRank}` : "-"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function WukeClient() {
  const [data, setData] = useState<WukePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("report");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [radarStudent, setRadarStudent] = useState<WukeStudentRow | null>(null);
  const [radarOpen, setRadarOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<WukeComparisonData | null>(null);
  const [comparisonPrevId, setComparisonPrevId] = useState("");
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);

  async function fetchData(examId?: string) {
    setLoading(true);
    const response = await fetch(`/api/wuke${examId ? `?examId=${examId}` : ""}`, { cache: "no-store" });
    const result = (await response.json()) as WukePageData;
    setData(result);
    setSelectedExamId(result.report?.examId ?? "");
    setComparisonPrevId(result.report?.previousExamId ?? "");
    setLoading(false);
  }

  async function deleteExam(examId: string) {
    const ok = window.confirm("确认删除这场考试及其所有五科成绩？");
    if (!ok) return;
    setDeletingExamId(examId);
    await fetch(`/api/exam/${examId}`, { method: "DELETE" });
    setDeletingExamId(null);
    await fetchData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchComparison(currentId: string, prevId: string) {
    if (!currentId || !prevId || currentId === prevId) return;
    setComparisonLoading(true);
    const response = await fetch(
      `/api/wuke?comparisonCurrent=${currentId}&comparisonPrev=${prevId}`,
      { cache: "no-store" }
    );
    if (response.ok) {
      const result = (await response.json()) as WukeComparisonData;
      setComparisonData(result);
    }
    setComparisonLoading(false);
  }

  const report = data?.report ?? null;

  const groupedStudents = useMemo(() => {
    if (!report) return { top: [], middle: [], bottom: [], all: [] };
    const all = report.students;
    const sorted = [...all].sort((a, b) => a.classRank - b.classRank);
    const top = sorted.slice(0, 10);
    const bottom = sorted.slice(-10);
    const middle = sorted.slice(10, Math.max(10, sorted.length - 10));
    return { top, middle, bottom, all: sorted };
  }, [report]);

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={16} />
        加载五科数据...
      </div>
    );
  }

  if (!data?.homeroomClassId) {
    return (
      <div className="animate-fadeIn space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">五科成绩</h1>
          <p className="mt-1 text-sm text-muted-foreground">班主任班级五科成绩管理</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-3 text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">尚未设置班主任班级</p>
            <p className="mt-1 text-xs text-muted-foreground">请前往「班级管理」页面设置一个班主任班级后使用五科功能</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/class/manage">前往班级管理</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">五科成绩</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.homeroomClassName} · 班主任班级
            </p>
          </div>
          <Button size="sm" onClick={() => setImportOpen(true)}>
            <Upload size={16} />
            导入五科成绩
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-3 text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">暂无五科成绩数据</p>
            <p className="mt-1 text-xs text-muted-foreground">请先导入一场大考成绩</p>
          </CardContent>
        </Card>
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={() => fetchData()} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">五科成绩</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.homeroomClassName} · {report.examName} · {report.examDate}
          </p>
        </div>
        <Button size="sm" onClick={() => setImportOpen(true)}>
          <Upload size={16} />
          导入五科成绩
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">总分均分</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{formatScore(report.summary.totalAverage)}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingDown className="rotate-180" size={20} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">参考人数</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{report.summary.participantCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">缺考 {report.summary.absentCount} 人</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">最高总分</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{report.summary.maxTotal}</p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Award size={20} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">最低总分</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{report.summary.minTotal}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <AlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">各科均分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {SUBJECT_ORDER.map((subject) => (
              <div key={subject} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[subject] }} />
                  <span className="text-sm font-medium">{SUBJECT_LABELS[subject]}</span>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight">{formatScore(report.summary.subjectAverages[subject])}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {data.exams.map((exam) => (
            <div key={exam.id} className="flex items-center gap-0.5">
              <Button
                variant={selectedExamId === exam.id ? "default" : "outline"}
                size="sm"
                onClick={() => fetchData(exam.id)}
                className="gap-1.5"
              >
                {exam.name}
                {exam.examType && (
                  <span className={`rounded px-1 py-0.5 text-[10px] font-semibold ${selectedExamId === exam.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"}`}>
                    {examTypeLabel(exam.examType)}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => deleteExam(exam.id)}
                disabled={deletingExamId === exam.id}
              >
                {deletingExamId === exam.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setTab("report")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "report" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            成绩单
          </button>
          <button
            onClick={() => {
              setTab("comparison");
              if (report.previousExamId && !comparisonData) {
                fetchComparison(selectedExamId, report.previousExamId);
              }
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "comparison" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            历史对比
          </button>
          <button
            onClick={() => setTab("warnings")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "warnings" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            预警
            {data.warnings.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
                {data.warnings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === "report" && (
        <Card>
          <CardHeader>
            <CardTitle>五科成绩单</CardTitle>
            <CardDescription>点击姓名查看偏科分析雷达图</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-14">排名</TableHead>
                  <TableHead>姓名</TableHead>
                  {SUBJECT_ORDER.map((subject) => (
                    <TableHead key={subject} className="text-center">
                      {SUBJECT_LABELS[subject]}
                      <span className="block text-xs font-normal text-muted-foreground">分数/名次</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">总分</TableHead>
                  <TableHead className="text-center">班排</TableHead>
                  <TableHead className="text-center">班排变化</TableHead>
                  <TableHead className="text-center">年排</TableHead>
                  <TableHead className="text-center">年排变化</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedStudents.all.map((row) => (
                  <TableRow key={row.studentId} className="row-accent cursor-pointer" onClick={() => { setRadarStudent(row); setRadarOpen(true); }}>
                    <TableCell>
                      <div className="flex justify-center">
                        <RankBadge rank={row.classRank} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary underline-offset-2 hover:underline">
                        {row.studentName}
                      </span>
                    </TableCell>
                    {SUBJECT_ORDER.map((subject) => {
                      const cell = row.subjects[subject];
                      return (
                        <TableCell key={subject} className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-mono text-sm ${scoreCellColor(cell.score, cell.isAbsent)}`}>
                              {cell.isAbsent ? "缺考" : formatScore(cell.score)}
                            </span>
                            {!cell.isAbsent && cell.subjectRank !== null && (
                              <span className="text-xs text-muted-foreground">#{cell.subjectRank}</span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-mono text-base font-bold">
                      {formatScore(row.totalScore)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm font-semibold">
                      {row.classRank}
                    </TableCell>
                    <TableCell className="text-center">{rankDeltaBadge(row.classRankDelta)}</TableCell>
                    <TableCell className="text-center font-mono text-sm font-semibold">
                      {row.gradeRank ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">{rankDeltaBadge(row.gradeRankDelta)}</TableCell>
                  </TableRow>
                ))}
                {groupedStudents.all.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "comparison" && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>历史对比</CardTitle>
                <CardDescription>选择两次考试对比各科进退步</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={comparisonPrevId}
                  onChange={(e) => {
                    setComparisonPrevId(e.target.value);
                    if (selectedExamId && e.target.value) {
                      fetchComparison(selectedExamId, e.target.value);
                    }
                  }}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="">选择对比考试</option>
                  {data.exams
                    .filter((e) => e.id !== selectedExamId)
                    .map((exam) => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {comparisonLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 animate-spin" size={16} />
                加载对比数据...
              </div>
            ) : comparisonData ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>姓名</TableHead>
                    {SUBJECT_ORDER.map((subject) => (
                      <TableHead key={subject} className="text-center">
                        {SUBJECT_LABELS[subject]}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">班排变化</TableHead>
                    <TableHead className="text-center">年排变化</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.rows.map((row) => (
                    <TableRow key={row.studentId}>
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      {SUBJECT_ORDER.map((subject) => {
                        const cell = row.subjects[subject];
                        return (
                          <TableCell key={subject} className="text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-mono text-sm">
                                {cell.currentAbsent ? "缺考" : formatScore(cell.current)}
                                <span className="text-muted-foreground"> / </span>
                                {cell.previousAbsent ? "缺考" : formatScore(cell.previous)}
                              </span>
                              {deltaBadge(cell.delta)}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">{rankDeltaBadge(row.classRankDelta)}</TableCell>
                      <TableCell className="text-center">{rankDeltaBadge(row.gradeRankDelta)}</TableCell>
                    </TableRow>
                  ))}
                  {comparisonData.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        暂无可对比数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                请选择要对比的历史考试
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "warnings" && (
        <Card>
          <CardHeader>
            <CardTitle>成绩预警</CardTitle>
            <CardDescription>
              单次班排下滑 &gt;3 名 · 连续两次班排下滑 ≤3 名
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.warnings.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                本次考试无预警学生
              </div>
            ) : (
              <div className="space-y-2">
                {data.warnings.map((row) => (
                  <div key={row.studentId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium">{row.studentName}</span>
                      <span className="font-mono text-sm text-muted-foreground">
                        总分 {formatScore(row.totalScore)} · 班排 {row.classRank} · 上次班排 {row.previousClassRank ?? "-"} · {rankDeltaBadge(row.classRankDelta)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.warnings.map((w) => <WarningBadge key={w} type={w} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={() => fetchData()} />
      <RadarDialog student={radarStudent} open={radarOpen} onOpenChange={setRadarOpen} />
    </div>
  );
}
