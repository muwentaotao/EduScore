import { NextRequest, NextResponse } from "next/server";
import { getAnalysisData } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId") ?? undefined;
  const data = await getAnalysisData(examId);

  const lines = ["排名,姓名,班级,分数"];
  for (const row of data.rankings) {
    lines.push(`${row.rank},${row.studentName},${row.className},${row.score}`);
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"grade-ranking.csv\""
    }
  });
}
