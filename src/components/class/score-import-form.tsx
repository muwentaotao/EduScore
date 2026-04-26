"use client";

import { useState } from "react";
import { Calendar, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  classId: string;
  compact?: boolean;
  onImported?: () => Promise<void> | void;
  examNameOptions?: string[];
};

export function ScoreImportForm({ classId, compact = false, onImported, examNameOptions = [] }: Props) {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
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
            <Label>考试名称</Label>
            <Input
              list={examNameListId}
              placeholder="例如：期中/期末/模拟测试"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
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
            <Label>考试日期</Label>
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>成绩文件（首行为表头）</Label>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button onClick={onImport} disabled={importing} className="w-full">
            {importing ? <Loader2 className="animate-spin" /> : <Upload />}
            导入成绩
          </Button>
        </div>
        {message && <CardDescription>{message}</CardDescription>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1.4fr_auto]">
        <div className="space-y-1.5">
          <Label>考试名称</Label>
          <Input
            list={examNameListId}
            placeholder="例如：期中/期末/模拟测试"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="h-11"
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
          <Label>考试日期</Label>
          <div className="relative">
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="h-11 pr-9" />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>成绩文件（首行为表头）</Label>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-11" />
        </div>
        <div className="flex items-end">
          <Button onClick={onImport} disabled={importing} className="h-11 w-full lg:w-[164px]">
            {importing ? <Loader2 className="animate-spin" /> : <Upload />}
            导入成绩
          </Button>
        </div>
      </div>
      {message && <CardDescription>{message}</CardDescription>}
    </div>
  );
}
