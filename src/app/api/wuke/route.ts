import { NextRequest, NextResponse } from "next/server";
import { getWukePageData, getWukeComparison } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const examId = request.nextUrl.searchParams.get("examId") ?? undefined;
  const comparisonPrev = request.nextUrl.searchParams.get("comparisonPrev");
  const comparisonCurrent = request.nextUrl.searchParams.get("comparisonCurrent");

  if (comparisonCurrent && comparisonPrev) {
    const comparison = await getWukeComparison(comparisonCurrent, comparisonPrev, "");
    if (!comparison) {
      return NextResponse.json({ message: "对比数据不存在" }, { status: 404 });
    }
    return NextResponse.json(comparison, { headers: { "Cache-Control": "no-store" } });
  }

  const data = await getWukePageData(examId);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
