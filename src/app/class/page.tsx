import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

function Sparkline({ points, color }: { points: (number | null)[]; color: string }) {
  const valid = points.filter((p) => p !== null) as number[];
  if (valid.length < 2) return null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const w = 160;
  const h = 40;
  const step = w / (valid.length - 1);
  const d = valid
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const areaD = `${d} L${(valid.length - 1) * step},${h} L0,${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function ClassIndexPage() {
  const data = await getDashboardData();

  const withAvg = data.classes
    .map((c) => ({ ...c, avg: c.latestAverage }))
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const overallAvg =
    withAvg.length > 0
      ? withAvg.reduce((s, c) => s + (c.avg ?? 0), 0) / withAvg.filter((c) => c.avg !== null).length
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">班级成绩</h1>
          <p className="mt-1 text-sm text-muted-foreground">各班级数据概览</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.classes.map((cls) => {
          const rank = withAvg.findIndex((c) => c.id === cls.id) + 1;
          const trend = data.classTrends.find((t) => t.classId === cls.id);
          const points = trend ? trend.points.map((p) => p.average) : [];

          return (
            <Link href={`/class/${cls.id}`} key={cls.id}>
              <Card className="group transition-all hover:shadow-card-hover hover:translate-y-[-1px]">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: cls.color }} />
                      <div>
                        <p className="text-lg font-semibold text-foreground">{cls.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users size={14} />
                          <span>{cls.studentCount} 名学生</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary">
                      <span>进入详情</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {cls.latestAverage !== null && (
                    <>
                      <div className="mt-5 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">最新均分</p>
                          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{cls.latestAverage}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">班级排名</p>
                          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            #{rank}
                            <span className="text-base font-normal text-muted-foreground"> / {data.classes.length}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">超均率</p>
                          {overallAvg > 0 && (
                            <p className={`mt-1 text-2xl font-bold tracking-tight ${cls.latestAverage >= overallAvg ? "text-success" : "text-destructive"}`}>
                              {cls.latestAverage >= overallAvg ? "+" : ""}
                              {((cls.latestAverage - overallAvg) / overallAvg * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>

                      {points.length >= 2 && (
                        <div className="mt-4">
                          <p className="mb-1 text-xs text-muted-foreground">历次均分走势</p>
                          <Sparkline points={points} color={cls.color} />
                        </div>
                      )}
                    </>
                  )}
                  {cls.latestAverage === null && (
                    <div className="mt-5">
                      <p className="text-sm text-muted-foreground">暂无成绩数据</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {data.classes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              暂无班级，请先创建
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
