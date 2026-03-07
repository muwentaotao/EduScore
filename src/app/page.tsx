import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "@/lib/data";

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
  return <span className="font-semibold text-slate-600">0</span>;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">成绩仪表盘</h1>
          <p className="text-sm text-muted-foreground">无登录直达，展示三班卡片与全年级总表。</p>
        </div>
        <Link href="/class/manage" className="text-sm text-sky-700 underline-offset-2 hover:underline">
          进入班级管理
        </Link>
      </div>

      <section className="dashboard-grid">
        {data.classes.map((classItem) => (
          <Link href={`/class/${classItem.id}`} key={classItem.id}>
            <Card className="animate-rise hover:-translate-y-0.5">
              <CardHeader>
                <div className="mb-1 h-2 w-full rounded-full" style={{ backgroundColor: classItem.color }} />
                <CardTitle>{classItem.name}</CardTitle>
                <CardDescription>学生数：{classItem.studentCount}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-sky-700">点击进入班级成绩页</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        <Card className="animate-rise border-sky-200 bg-gradient-to-br from-white to-sky-50">
          <CardHeader>
            <CardTitle>全年级大总表</CardTitle>
            <CardDescription>三班合计 {data.rows.length} 名学生</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">按进步分进行排名（最近一次成绩 - 上一次成绩）。</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>进步排名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                {data.exams.map((exam) => (
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
                  <TableCell>{row.className}</TableCell>
                  {data.exams.map((exam) => (
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
