"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreImportForm } from "@/components/class/score-import-form";

type ClassItem = { id: string; name: string; color: string; studentCount: number };

export function ScoreImportClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchClasses() {
    setLoading(true);
    const res = await fetch("/api/class", { cache: "no-store" });
    const result = (await res.json()) as ClassItem[];
    setClasses(result);
    if (result.length > 0 && !selectedClassId) {
      setSelectedClassId(result[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchClasses();
  }, []);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">成绩导入</h1>
        <p className="mt-1 text-sm text-muted-foreground">选择班级后上传 Excel 成绩文件</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选择班级</CardTitle>
          <CardDescription>成绩将导入到所选班级，并按姓名匹配或创建学生</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-wrap gap-3 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-28" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无班级，请先创建班级</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedClassId === cls.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: cls.color }} />
                  <span className="font-medium">{cls.name}</span>
                  <span className="text-xs text-muted-foreground">{cls.studentCount} 人</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: selectedClass.color }} />
              <CardTitle>{selectedClass.name}</CardTitle>
            </div>
            <CardDescription>上传 Excel 成绩文件</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreImportForm classId={selectedClass.id} onImported={fetchClasses} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
