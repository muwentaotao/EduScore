import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClassIndexPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">班级成绩</h1>
          <p className="mt-1 text-sm text-muted-foreground">选择班级查看详情</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {data.classes.map((classItem) => (
          <Link href={`/class/${classItem.id}`} key={classItem.id}>
            <Card className="inline-flex items-center gap-3 px-4 py-3 transition-shadow hover:shadow-card-hover">
              <div className="size-3 rounded-full" style={{ backgroundColor: classItem.color }} />
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold">{classItem.name}</span>
                <span className="text-xs text-muted-foreground">{classItem.studentCount} 人</span>
              </div>
            </Card>
          </Link>
        ))}
        {data.classes.length === 0 && (
          <p className="text-sm text-muted-foreground">暂无班级，请先创建</p>
        )}
      </div>
    </div>
  );
}
