"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StudentListItem } from "@/lib/types";

type ClassOption = { id: string; name: string; color: string };

export function StudentManageClient() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filterClassId, setFilterClassId] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentListItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchAll() {
    setLoading(true);
    const [studentRes, classRes] = await Promise.all([
      fetch("/api/students", { cache: "no-store" }),
      fetch("/api/class", { cache: "no-store" })
    ]);
    const studentData = (await studentRes.json()) as StudentListItem[];
    const classData = (await classRes.json()) as ClassOption[];
    setStudents(studentData);
    setClasses(classData);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterClassId !== "all" && s.classId !== filterClassId) return false;
      if (keyword.trim() && !s.name.toLowerCase().includes(keyword.trim().toLowerCase())) return false;
      return true;
    });
  }, [students, keyword, filterClassId]);

  function openAdd() {
    setFormName("");
    setFormClassId(classes[0]?.id ?? "");
    setMessage("");
    setShowAdd(true);
  }

  function openEdit(student: StudentListItem) {
    setFormName(student.name);
    setFormClassId(student.classId);
    setMessage("");
    setEditingStudent(student);
  }

  async function submitAdd() {
    if (!formName.trim() || !formClassId) {
      setMessage("请填写姓名和班级");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName.trim(), classId: formClassId })
    });
    setSaving(false);
    if (!res.ok) {
      const result = await res.json();
      setMessage(result.message || "添加失败");
      return;
    }
    setShowAdd(false);
    await fetchAll();
  }

  async function submitEdit() {
    if (!editingStudent) return;
    if (!formName.trim() || !formClassId) {
      setMessage("请填写姓名和班级");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/students/${editingStudent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName.trim(), classId: formClassId })
    });
    setSaving(false);
    if (!res.ok) {
      const result = await res.json();
      setMessage(result.message || "修改失败");
      return;
    }
    setEditingStudent(null);
    await fetchAll();
  }

  async function confirmDelete() {
    if (!deletingStudent) return;
    setSaving(true);
    await fetch(`/api/students/${deletingStudent.id}`, { method: "DELETE" });
    setSaving(false);
    setDeletingStudent(null);
    await fetchAll();
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">学生管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">全年级 {students.length} 名学生</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <UserPlus size={16} />
          添加学生
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>学生列表</CardTitle>
            <CardDescription>点击姓名查看个人成绩档案</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索姓名" className="h-9 pl-9" />
            </div>
            <Select value={filterClassId} onValueChange={setFilterClassId}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="筛选班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 animate-spin" size={16} />
              加载中...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>姓名</TableHead>
                  <TableHead>班级</TableHead>
                  <TableHead>考试次数</TableHead>
                  <TableHead>最近成绩</TableHead>
                  <TableHead>建档日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/students/${s.id}`} className="text-primary hover:underline">
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${s.classColor}15`, borderColor: `${s.classColor}30` }}
                      >
                        {s.className}
                      </span>
                    </TableCell>
                    <TableCell>{s.examCount}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold">{s.latestScore ?? "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeletingStudent(s)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      没有匹配的学生
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={(open) => !open && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加学生</DialogTitle>
            <DialogDescription>手动添加单个学生到指定班级</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>姓名</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="输入学生姓名" />
            </div>
            <div className="space-y-1.5">
              <Label>所属班级</Label>
              <Select value={formClassId} onValueChange={setFormClassId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择班级" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>取消</Button>
            <Button size="sm" onClick={submitAdd} disabled={saving}>
              {saving && <Loader2 className="animate-spin" size={16} />}
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingStudent)} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑学生</DialogTitle>
            <DialogDescription>修改姓名或转班</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>姓名</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>所属班级</Label>
              <Select value={formClassId} onValueChange={setFormClassId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择班级" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingStudent(null)}>取消</Button>
            <Button size="sm" onClick={submitEdit} disabled={saving}>
              {saving && <Loader2 className="animate-spin" size={16} />}
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingStudent)} onOpenChange={(open) => !open && setDeletingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              将永久删除「{deletingStudent?.name}」及其所有成绩，不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingStudent(null)}>取消</Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={saving}>
              {saving && <Loader2 className="animate-spin" size={16} />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
