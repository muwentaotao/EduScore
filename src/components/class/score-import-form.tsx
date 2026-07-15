"use client";

import { useState } from "react";
import { Calendar, Loader2, Upload } from "lucide-react";
import type { ExamType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXAM_TYPE_LABELS, EXAM_TYPE_ORDER } from "@/lib/subject";

type Props = {
  classId: string;
  compact?: boolean;
  onImported?: () => Promise<void> | void;
  examNameOptions?: string[];
};

export function ScoreImportForm({ classId, compact = false, onImported, examNameOptions = [] }: Props) {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examType, setExamType] = useState<ExamType>("MONTHLY");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const examNameListId = `exam-name-options-${classId}`;

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

    const response = await fetch(`/api/class/${classId}/import`, { method: "POST", body: formData });
    const result = await response.json();

    setMessage(result.message || "导入完成");
    setImporting(false);
    setFile(null);

    if (onImported) {
      await onImported();
    }
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">考试名称</Label>
            <Input
              list={examNameListId}
              placeholder="例如：期中/期末"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="h-9"
            />
            {examNameOptions.length > 0 && (
              <datalist id={examNameListId}>
                {[...new Set(examNameOptions)].map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">考试日期</Label>
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">考试类型</Label>
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
            <Label className="text-xs">成绩文件（首行为表头）</Label>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-9" />
          </div>
          <Button onClick={onImport} disabled={importing} className="w-full">
            {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            导入
          </Button>
        </div>
        {message && <CardDescription>{message}</CardDescription>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">考试名称</Label>
          <Input
            list={examNameListId}
            placeholder="例如：期中/期末/模拟"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="h-9"
          />
          {examNameOptions.length > 0 && (
            <datalist id={examNameListId}>
              {[...new Set(examNameOptions)].map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
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
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-9" />
        </div>
        <div className="flex items-end">
          <Button onClick={onImport} disabled={importing} className="h-9">
            {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            导入
          </Button>
        </div>
      </div>
      {message && <CardDescription>{message}</CardDescription>}
    </div>
  );
}
