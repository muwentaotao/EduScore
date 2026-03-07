import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, context: RouteContext<"/api/exam/[examId]">) {
  const { examId } = await context.params;
  const found = await prisma.exam.findUnique({ where: { id: examId } });
  if (!found) {
    return NextResponse.json({ message: "考试不存在" }, { status: 404 });
  }

  await prisma.exam.delete({ where: { id: examId } });
  return NextResponse.json({ message: "考试及其成绩已删除" });
}
