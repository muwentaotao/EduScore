import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Building2,
  Medal,
  Minus,
  School,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/data";
import { DashboardTrendChart } from "@/components/dashboard/dashboard-trend-chart";

export const dynamic = "force-dynamic";

function ProgressCell({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus size={12} />
        暂无
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={12} />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
        <ArrowDownRight size={12} />
        {delta}
      </span>
    );
  }
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">0</span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="size-5 text-amber-500" />;
  if (rank === 2) return <Medal className="size-5 text-slate-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-700" />;
  return <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{rank}</span>;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const displayExams = data.exams.slice(-5);
  const totalStudents = data.classes.reduce((sum, c) => sum + c.studentCount, 0);
  const topImprover = data.rows[0];

  const trendChartData = data.exams.map((exam) => {
    const row: Record<string, string | number> = { name: exam.name };
    for (const t of data.classTrends) {
      const pt = t.points.find((p) => p.examId === exam.id);
      row[t.className] = pt?.average ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">教学概览</h1>
          <p className="mt-1 text-sm text-muted-foreground">全年级成绩数据一览</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/class/manage">班级管理</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/students">学生管理</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">班级总数</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{data.classes.length}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 size={20} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">学生总数</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{totalStudents}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">考试场次</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{data.exams.length}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <School size={20} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">进步之星</p>
              <p className="mt-1 truncate text-lg font-bold tracking-tight">{topImprover?.studentName ?? "-"}</p>
              {topImprover && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {topImprover.className} · +{topImprover.progressDelta} 分
                </p>
              )}
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Award size={20} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main trend chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>班级均分趋势</CardTitle>
            <CardDescription>各班最近 {data.exams.length} 场考试平均分走势</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DashboardTrendChart data={trendChartData} series={data.classTrends.map((t) => ({ key: t.className, color: t.classColor }))} />
        </CardContent>
      </Card>

      {/* Class quick entry */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.classes.map((cls) => (
          <Link href={`/class/${cls.id}`} key={cls.id}>
            <Card className="transition-shadow hover:shadow-card-hover">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: cls.color }} />
                    <div>
                      <p className="font-semibold text-foreground">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">{cls.studentCount} 名学生</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tracking-tight">{cls.latestAverage ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">最新均分</p>
                  </div>
                </div>
                {cls.latestAverage !== null && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, cls.latestAverage))}%`, backgroundColor: cls.color }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Progress ranking */}
      <Card>
        <CardHeader>
          <CardTitle>学生进步榜</CardTitle>
          <CardDescription>按最近两场考试分数差排序</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">排名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                {displayExams.map((exam) => (
                  <TableHead key={exam.id}>{exam.name}</TableHead>
                ))}
                <TableHead>进步分数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.slice(0, 20).map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <div className="flex justify-center">
                      <RankBadge rank={row.rank} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{row.studentName}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${row.classColor}15`,
                        borderColor: `${row.classColor}30`
                      }}
                    >
                      {row.className}
                    </span>
                  </TableCell>
                  {displayExams.map((exam) => (
                    <TableCell key={exam.id} className="font-mono text-sm">
                      {row.scores[exam.id] ?? "-"}
                    </TableCell>
                  ))}
                  <TableCell>
                    <ProgressCell delta={row.progressDelta} />
                  </TableCell>
                </TableRow>
              ))}
              {data.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
