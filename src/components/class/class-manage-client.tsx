"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Archive, History, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type ClassItem = {
  id: string;
  name: string;
  color: string;
  studentCount: number;
  graduatedStudentCount: number;
  archived: boolean;
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
    const response = await fetch("/api/class?includeArchived=true", { cache: "no-store" });
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

  const currentClasses = classes.filter((classItem) => !classItem.archived);
  const archivedClasses = classes.filter((classItem) => classItem.archived);

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">班级管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理当前任教班级，毕业班级保留在归档中</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {currentClasses.map((classItem) => (
            <Card key={classItem.id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full" style={{ backgroundColor: classItem.color }} />
                    <div>
                      <p className="font-semibold">{classItem.name}</p>
                      <p className="text-xs text-muted-foreground">{classItem.studentCount} 人</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
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
          {currentClasses.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
                暂无当前班级，请在下方创建八年级班级
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
                placeholder="例如：八年级2班"
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

      {archivedClasses.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Archive className="size-4 text-muted-foreground" />
              <CardTitle>毕业归档</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">历史学生和成绩仍然保留，不参与当前统计</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {archivedClasses.map((classItem) => (
              <div key={classItem.id} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full" style={{ backgroundColor: classItem.color }} />
                  <div>
                    <p className="font-semibold text-foreground">{classItem.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {classItem.graduatedStudentCount} 名毕业生 · 历史数据已保留
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link href={`/class/archive/${classItem.id}` as Route}>
                    <History size={14} />
                    查看历史成绩
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
