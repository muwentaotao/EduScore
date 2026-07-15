import { NextRequest, NextResponse } from "next/server";
import { getWukeStudentHistory } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ message: "缺少 studentId" }, { status: 400 });
  }
  const data = await getWukeStudentHistory(studentId);
  if (!data) {
    return NextResponse.json({ message: "学生不存在" }, { status: 404 });
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}