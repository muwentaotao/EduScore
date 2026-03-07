"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  classId: string;
  compact?: boolean;
  onImported?: () => Promise<void> | void;
};

export function ScoreImportForm({ classId, compact = false, onImported }: Props) {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  async function onImport() {
    if (!file || !examName.trim() || !examDate) {
      setMessage("请填写考试名称、导入日期并上传成绩文件");
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

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "lg:grid-cols-4"}`}>
        <div className="space-y-1.5">
          <Label>考试名称</Label>
          <Input placeholder="例如：期中考试/随堂测试" value={examName} onChange={(e) => setExamName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>导入日期</Label>
          <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>成绩文件（第一行表头）</Label>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex items-end">
          <Button onClick={onImport} disabled={importing} className="w-full lg:w-auto">
            {importing ? <Loader2 className="animate-spin" /> : <Upload />}
            导入成绩
          </Button>
        </div>
      </div>
      {message && <CardDescription>{message}</CardDescription>}
    </div>
  );
}
