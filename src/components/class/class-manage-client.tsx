"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClassItem = {
  id: string;
  name: string;
  color: string;
  studentCount: number;
};

export function ClassManageClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function fetchClasses() {
    setLoading(true);
    const response = await fetch("/api/class", { cache: "no-store" });
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
    setSaving(false);
    if (!response.ok) {
      setMessage(result.message || "创建失败");
      return;
    }
    setName("");
    setColor("#3b82f6");
    await fetchClasses();
  }

  async function deleteClass(classItem: ClassItem) {
    const ok = window.confirm(`确认删除 ${classItem.name}？将删除该班所有考生和成绩。`);
    if (!ok) return;
    setDeletingClassId(classItem.id);
    await fetch(`/api/class/${classItem.id}`, { method: "DELETE" });
    setDeletingClassId(null);
    await fetchClasses();
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">班级管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理班级、查看班级详情</p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 animate-spin" size={16} />
          加载中...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardContent className="flex items-center justify-between pt-5">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full" style={{ backgroundColor: classItem.color }} />
                  <div>
                    <p className="font-semibold">{classItem.name}</p>
                    <p className="text-xs text-muted-foreground">{classItem.studentCount} 人</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/class/${classItem.id}`}>
                    <Button size="sm" variant="outline">详情</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => deleteClass(classItem)}
                    disabled={deletingClassId === classItem.id}
                  >
                    {deletingClassId === classItem.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {classes.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
                暂无班级，请先创建
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>新增班级</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">班级名称</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：九年级(4)班"
                className="h-9 w-[200px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">颜色</Label>
              <div className="flex h-9 items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-9 cursor-pointer rounded-md border border-border bg-card p-1"
                />
              </div>
            </div>
            <Button onClick={createClass} disabled={saving} className="h-9">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              创建
            </Button>
          </div>
          {message && <p className="mt-2 text-sm text-destructive">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
