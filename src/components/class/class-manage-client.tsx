"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreImportForm } from "@/components/class/score-import-form";

type ClassItem = {
  id: string;
  name: string;
  color: string;
  studentCount: number;
};

export function ClassManageClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#38bdf8");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function fetchClasses() {
    setLoading(true);
    const response = await fetch("/api/class");
    const result = (await response.json()) as ClassItem[];
    setClasses(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchClasses();
  }, []);

  async function createClass() {
    if (!name.trim()) {
      setMessage("请填写班级名称");
      return;
    }
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message || "创建失败");
      setSaving(false);
      return;
    }

    setName("");
    setColor("#38bdf8");
    setSaving(false);
    setMessage("班级创建成功");
    await fetchClasses();
  }

  async function deleteClass(classItem: ClassItem) {
    const ok = window.confirm(`确认删除 ${classItem.name}？将同时删除该班考生和成绩。`);
    if (!ok) {
      return;
    }
    setDeletingClassId(classItem.id);
    setMessage("");
    const response = await fetch(`/api/class/${classItem.id}`, { method: "DELETE" });
    const result = await response.json();
    setDeletingClassId(null);
    setMessage(result.message || "删除完成");
    await fetchClasses();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">班级管理</h1>
        <p className="text-sm text-muted-foreground">单科系统：导入时自动按姓名匹配考生并写入成绩。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新增班级</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="class-name">班级名称</Label>
            <Input id="class-name" placeholder="例如：九年级(4)班" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="class-color">卡片颜色</Label>
            <Input id="class-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
          </div>
          <div className="flex items-end">
            <Button onClick={createClass} disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="animate-spin" /> : <Plus />}
              创建班级
            </Button>
          </div>
        </CardContent>
        {message && (
          <CardContent className="pt-0">
            <CardDescription>{message}</CardDescription>
          </CardContent>
        )}
      </Card>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 animate-spin" size={16} />
          加载班级中...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>{classItem.name}</CardTitle>
                    <CardDescription>考生数：{classItem.studentCount}</CardDescription>
                  </div>
                  <span className="h-7 w-7 rounded-full border" style={{ backgroundColor: classItem.color }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScoreImportForm classId={classItem.id} compact onImported={fetchClasses} />
                <div className="flex flex-wrap gap-2">
                  <Link href={`/class/${classItem.id}`}>
                    <Button>进入班级成绩页</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={() => deleteClass(classItem)}
                    disabled={deletingClassId === classItem.id}
                  >
                    {deletingClassId === classItem.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    删除班级
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
