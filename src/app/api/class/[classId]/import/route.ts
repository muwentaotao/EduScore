import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFileToRecords } from "@/lib/import";

function normalizeName(name: string) {
  return name.replace(/\s+/g, "").toLowerCase();
}

export async function POST(request: NextRequest, context: RouteContext<"/api/class/[classId]/import">) {
  const { classId } = await context.params;
  const classInfo = await prisma.class.findUnique({ where: { id: classId } });
  if (!classInfo) {
    return NextResponse.json({ message: "班级不存在" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const examName = String(formData.get("examName") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "").trim();

  if (!file || !examName || !examDate) {
    return NextResponse.json({ message: "请填写考试名称、导入日期并上传成绩文件" }, { status: 400 });
  }

  const records = parseFileToRecords(await file.arrayBuffer());
  if (!records.length) {
    return NextResponse.json({ message: "未识别到有效数据，请确认第一行表头包含“姓名”和“成绩”" }, { status: 400 });
  }

  const exam = await prisma.exam.upsert({
    where: { name: examName },
    update: { date: new Date(examDate) },
    create: { name: examName, date: new Date(examDate) }
  });

  const existingStudents = await prisma.student.findMany({ where: { classId } });
  const studentMap = new Map(existingStudents.map((s) => [normalizeName(s.name), s]));

  const uniqueByName = new Map<string, { name: string; score: number }>();
  for (const record of records) {
    uniqueByName.set(normalizeName(record.name), { name: record.name, score: record.score });
  }

  let createdStudents = 0;
  let savedScores = 0;

  for (const [normalizedName, record] of uniqueByName.entries()) {
    let student = studentMap.get(normalizedName);
    if (!student) {
      student = await prisma.student.create({
        data: { classId, name: record.name, studentNo: null }
      });
      studentMap.set(normalizedName, student);
      createdStudents += 1;
    }

    await prisma.score.upsert({
      where: {
        studentId_examId: {
          studentId: student.id,
          examId: exam.id
        }
      },
      update: { score: record.score, classId },
      create: { classId, studentId: student.id, examId: exam.id, score: record.score }
    });
    savedScores += 1;
  }

  return NextResponse.json({
    message: `导入完成：新增考生 ${createdStudents} 人，写入成绩 ${savedScores} 条`
  });
}
