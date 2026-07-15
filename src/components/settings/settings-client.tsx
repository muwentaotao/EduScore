"use client";

import { useRef, useState } from "react";
import { Download, GraduationCap, Loader2, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsClient() {
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [graduating, setGraduating] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function downloadTemplate() {
    setDownloadingTemplate(true);
    const response = await fetch("/api/wuke/template");
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wuke-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloadingTemplate(false);
  }

  async function backupData() {
    setBackingUp(true);
    const response = await fetch("/api/backup");
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eduscore-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("备份文件已下载");
    } else {
      setMessage("备份失败");
    }
    setBackingUp(false);
  }

  async function restoreData(file: File) {
    const ok = window.confirm("恢复将覆盖当前所有数据，确定继续？");
    if (!ok) return;
    setRestoring(true);
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      setMessage(result.message || "恢复完成");
    } catch {
      setMessage("文件解析失败，请确认是有效的备份文件");
    }
    setRestoring(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function graduateAll() {
    const ok = window.confirm("确认将所有九年级学生标记为毕业并归档？归档后学生将从日常页面消失。");
    if (!ok) return;
    setGraduating(true);
    const response = await fetch("/api/graduation", { method: "POST" });
    const result = await response.json();
    setMessage(result.message || "操作完成");
    setGraduating(false);
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">模板下载、数据备份与恢复、毕业归档</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">五科 Excel 模板</CardTitle>
            <CardDescription>下载标准导入模板，表头：班级、姓名、语文、数学、英语、科学、社会、年级排名</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} disabled={downloadingTemplate}>
              {downloadingTemplate ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              下载模板
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">数据备份</CardTitle>
            <CardDescription>一键导出全库数据为 JSON 文件，妥善保存以备恢复</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={backupData} disabled={backingUp}>
              {backingUp ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              导出备份
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">数据恢复</CardTitle>
            <CardDescription>上传备份 JSON 文件恢复数据，将覆盖当前所有数据</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) restoreData(file);
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={restoring}>
              {restoring ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}
              选择备份文件恢复
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">毕业归档</CardTitle>
            <CardDescription>一键将所有学生标记为毕业，归档后从日常页面消失</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={graduateAll} disabled={graduating}>
              {graduating ? <Loader2 className="animate-spin" size={16} /> : <GraduationCap size={16} />}
              一键毕业归档
            </Button>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
