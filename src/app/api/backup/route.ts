import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [classes, students, exams, scores] = await Promise.all([
    prisma.class.findMany(),
    prisma.student.findMany(),
    prisma.exam.findMany(),
    prisma.score.findMany()
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    classes: classes.map((c) => ({
      id: c.id, name: c.name, color: c.color, isHomeroom: c.isHomeroom,
      createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString()
    })),
    students: students.map((s) => ({
      id: s.id, name: s.name, classId: s.classId, graduated: s.graduated,
      createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString()
    })),
    exams: exams.map((e) => ({
      id: e.id, name: e.name, date: e.date.toISOString(), isMultiSubject: e.isMultiSubject,
      createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString()
    })),
    scores: scores.map((s) => ({
      id: s.id, studentId: s.studentId, examId: s.examId, classId: s.classId,
      subject: s.subject, score: s.score, isAbsent: s.isAbsent, gradeRank: s.gradeRank,
      createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString()
    }))
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `eduscore-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.classes || !body.students || !body.exams || !body.scores) {
      return NextResponse.json({ message: "备份文件格式不正确" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.score.deleteMany(),
      prisma.student.deleteMany(),
      prisma.exam.deleteMany(),
      prisma.class.deleteMany()
    ]);

    for (const c of body.classes) {
      await prisma.class.create({
        data: {
          id: c.id, name: c.name, color: c.color, isHomeroom: c.isHomeroom ?? false,
          createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt)
        }
      });
    }

    for (const s of body.students) {
      await prisma.student.create({
        data: {
          id: s.id, name: s.name, classId: s.classId, graduated: s.graduated ?? false,
          createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt)
        }
      });
    }

    for (const e of body.exams) {
      await prisma.exam.create({
        data: {
          id: e.id, name: e.name, date: new Date(e.date), isMultiSubject: e.isMultiSubject ?? false,
          createdAt: new Date(e.createdAt), updatedAt: new Date(e.updatedAt)
        }
      });
    }

    for (const s of body.scores) {
      await prisma.score.create({
        data: {
          id: s.id, studentId: s.studentId, examId: s.examId, classId: s.classId,
          subject: s.subject, score: s.score, isAbsent: s.isAbsent ?? false,
          gradeRank: s.gradeRank ?? null,
          createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt)
        }
      });
    }

    return NextResponse.json({ message: `恢复完成：${body.classes.length} 个班级，${body.students.length} 个学生，${body.exams.length} 场考试，${body.scores.length} 条成绩` });
  } catch {
    return NextResponse.json({ message: "恢复失败，请确认备份文件完整" }, { status: 500 });
  }
}
