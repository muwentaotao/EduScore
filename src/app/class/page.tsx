import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data";

export default async function ClassIndexPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">班级成绩入口</h1>
        <Link href="/class/manage" className="text-sm text-sky-700 underline-offset-2 hover:underline">
          班级管理
        </Link>
      </div>
      <div className="dashboard-grid">
        {data.classes.map((classItem) => (
          <Link href={`/class/${classItem.id}`} key={classItem.id}>
            <Card className="hover:-translate-y-0.5">
              <CardHeader>
                <div className="mb-1 h-2 w-full rounded-full" style={{ backgroundColor: classItem.color }} />
                <CardTitle>{classItem.name}</CardTitle>
                <CardDescription>查看班级平均分、学生分数与趋势图。</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
