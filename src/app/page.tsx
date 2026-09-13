import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { getDashboardData } from "@/lib/data";
import { DashboardTrendChart, Sparkline } from "@/components/dashboard/dashboard-trend-chart";
import { ProgressBoard } from "@/components/dashboard/progress-board";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const displayExams = data.exams.slice(-5);
  const totalStudents = data.classes.reduce((sum, c) => sum + c.studentCount, 0);
  const topImprover = data.rows[0];

  const trendChartData = data.exams.map((exam) => {
    const row: Record<string, string | number | null> = { name: exam.name };
    for (const t of data.classTrends) {
      const pt = t.points.find((p) => p.examId === exam.id);
      row[t.className] = pt?.average ?? null;
    }
    return row;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">教学概览</h1>
        <p className="mt-1 text-sm text-muted-foreground">当前任教班级成绩数据一览</p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground">当前班级</p>
            <p className="mt-2 text-3xl font-bold tracking-tight"><CountUp value={data.classes.length} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground">学生总数</p>
            <p className="mt-2 text-3xl font-bold tracking-tight"><CountUp value={totalStudents} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-muted-foreground">考试场次</p>
            <p className="mt-2 text-3xl font-bold tracking-tight"><CountUp value={data.exams.length} /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-end justify-between gap-2 pt-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">进步之星</p>
              <p className="mt-2 truncate text-lg font-bold tracking-tight">{topImprover?.studentName ?? "-"}</p>
              {topImprover && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {topImprover.className} · +{topImprover.progressDelta} 分
                </p>
              )}
            </div>
            {topImprover && topImprover.sparkline.length >= 2 && (
              <div className="shrink-0">
                <Sparkline data={topImprover.sparkline} color={topImprover.classColor} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Main trend chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>班级均分趋势</CardTitle>
            <CardDescription>当前各班最近 {data.exams.length} 场考试平均分走势</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {data.exams.length > 0 ? (
            <DashboardTrendChart data={trendChartData} series={data.classTrends.map((t) => ({ key: t.className, color: t.classColor }))} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              暂无当前成绩，创建班级并导入成绩后将在这里显示
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class quick entry */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                      className="bar-grow h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, cls.latestAverage))}%`, backgroundColor: cls.color }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
        {data.classes.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              暂无当前班级，请先前往班级管理创建
            </CardContent>
          </Card>
        ) : null}
      </section>

      {/* Progress / decline board */}
      <ProgressBoard rows={data.rows} exams={displayExams} />
    </div>
  );
}
