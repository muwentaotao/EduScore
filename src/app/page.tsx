import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Building2, Minus, School, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

function ProgressCell({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus size={14} />
        暂无数据
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
        <ArrowUpRight size={14} />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
        <ArrowDownRight size={14} />
        {delta}
      </span>
    );
  }
  return <span className="font-semibold text-muted-foreground">0</span>;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const displayExams = data.exams.slice(-5);
  const totalStudents = data.classes.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            教学概览 · <span className="text-primary">仪表盘</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">展示最近 5 场考试的学生进步排名和班级入口。</p>
        </div>
        <Link href="/class/manage" className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
          进入班级管理
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="rounded-2xl bg-blue-500 p-3 text-white">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">班级总数</p>
              <p className="text-5xl font-bold leading-none">{data.classes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="rounded-2xl bg-emerald-500 p-3 text-white">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">学生总数</p>
              <p className="text-5xl font-bold leading-none">{totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="rounded-2xl bg-violet-500 p-3 text-white">
              <School size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">考试场次</p>
              <p className="text-5xl font-bold leading-none">{data.exams.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>班级快速入口</CardTitle>
          <CardDescription>点击班级卡片进入班级成绩分析。</CardDescription>
        </CardHeader>
        <CardContent>
          <section className="grid gap-4 md:grid-cols-3">
            {data.classes.map((classItem) => (
              <Link href={`/class/${classItem.id}`} key={classItem.id}>
                <Card className="h-full border-slate-200/80 bg-white transition hover:border-primary/40">
                  <CardHeader>
                    <div className="mb-1 h-2 w-full rounded-full" style={{ backgroundColor: classItem.color }} />
                    <CardTitle>{classItem.name}</CardTitle>
                    <CardDescription>考生数：{classItem.studentCount}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </section>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>学生进步榜（最近 5 场）</CardTitle>
          <CardDescription>按最新与上一次成绩差值排序。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>进步排名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                {displayExams.map((exam) => (
                  <TableHead key={exam.id}>{exam.name}</TableHead>
                ))}
                <TableHead>进步分数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.studentName}</TableCell>
                  <TableCell>
                    <span
                      className="rounded-md border px-2 py-1 text-xs"
                      style={{
                        backgroundColor: `${row.classColor}22`,
                        borderColor: `${row.classColor}66`
                      }}
                    >
                      {row.className}
                    </span>
                  </TableCell>
                  {displayExams.map((exam) => (
                    <TableCell key={exam.id}>{row.scores[exam.id] ?? "-"}</TableCell>
                  ))}
                  <TableCell>
                    <ProgressCell delta={row.progressDelta} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
