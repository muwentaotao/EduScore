import { NextRequest, NextResponse } from "next/server";
import { getAnalysisData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId") ?? undefined;
  const data = await getAnalysisData(examId);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
