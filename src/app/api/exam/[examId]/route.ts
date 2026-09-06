import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, context: RouteContext<"/api/exam/[examId]">) {
  const { examId } = await context.params;
  const found = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      scores: {
        where: { student: { graduated: true } },
        select: { id: true },
        take: 1
      }
    }
  });
  if (!found) {
    return NextResponse.json({ message: "考试不存在" }, { status: 404 });
  }
  if (found.scores.length > 0) {
    return NextResponse.json(
      { message: "该考试属于毕业归档，不能删除" },
      { status: 409 }
    );
  }

  await prisma.exam.delete({ where: { id: examId } });
  return NextResponse.json({ message: "考试及其成绩已删除" });
}
