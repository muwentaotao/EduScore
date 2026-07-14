import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    studentId?: string;
    examId?: string;
    score?: number;
    isAbsent?: boolean;
  };

  const studentId = payload.studentId?.trim();
  const examId = payload.examId?.trim();
  const score = payload.score;
  const isAbsent = Boolean(payload.isAbsent);

  if (!studentId || !examId) {
    return NextResponse.json({ message: "学生和考试不能为空" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ message: "学生不存在" }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) {
    return NextResponse.json({ message: "考试不存在" }, { status: 400 });
  }

  if (!isAbsent) {
    if (score === undefined || score === null || Number.isNaN(score)) {
      return NextResponse.json({ message: "请输入有效分数或标记缺考" }, { status: 400 });
    }
  }

  const finalScore = isAbsent ? 0 : Number(score);

  const result = await prisma.score.upsert({
    where: { studentId_examId: { studentId, examId } },
    update: { score: finalScore, isAbsent, classId: student.classId },
    create: { studentId, examId, classId: student.classId, score: finalScore, isAbsent }
  });

  return NextResponse.json({ id: result.id, message: "成绩已保存" });
}
