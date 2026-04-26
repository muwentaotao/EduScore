import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClassIndexPage() {
  const data = await getDashboardData();

  return (
    <div className="flex min-h-[calc(100vh-150px)] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">
          班级成绩 · <span className="text-primary">选择班级</span>
        </h1>
        <Link href="/class/manage" className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
          班级管理
        </Link>
      </div>

      <div className="grid min-h-[calc(100vh-260px)] auto-rows-fr gap-4 md:grid-cols-3">
        {data.classes.map((classItem) => (
          <Link href={`/class/${classItem.id}`} key={classItem.id} className="h-full">
            <Card className="h-full border-slate-200/80 bg-white/90 transition hover:border-primary/40">
              <CardHeader className="h-full justify-between">
                <div>
                  <div className="mb-2 h-2 w-full rounded-full" style={{ backgroundColor: classItem.color }} />
                  <CardTitle className="text-2xl">{classItem.name}</CardTitle>
                  <CardDescription className="mt-2 text-sm">查看班级平均分、学生分数与趋势图。</CardDescription>
                </div>
                <p className="text-sm text-muted-foreground">考生数：{classItem.studentCount}</p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
