import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFileToRecords } from "@/lib/import";
import type { ExamType } from "@prisma/client";
import { EXAM_TYPE_LABELS } from "@/lib/exam-type";

function normalizeName(name: string) {
  return name.replace(/\s+/g, "").toLowerCase();
}

export async function POST(request: NextRequest, context: RouteContext<"/api/class/[classId]/import">) {
  const { classId } = await context.params;
  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      _count: { select: { students: true } },
      students: { where: { graduated: false } }
    }
  });
  if (!classInfo) {
    return NextResponse.json({ message: "班级不存在" }, { status: 404 });
  }
  if (classInfo._count.students > 0 && classInfo.students.length === 0) {
    return NextResponse.json(
      { message: "该班级已经毕业归档，请在当前班级中导入成绩" },
      { status: 409 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const examName = String(formData.get("examName") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "").trim();
  const examTypeRaw = String(formData.get("examType") ?? "").trim() as ExamType;

  if (!file || !examName || !examDate) {
    return NextResponse.json({ message: "请填写考试名称、导入日期并上传成绩文件" }, { status: 400 });
  }

  const examType = examTypeRaw && examTypeRaw in EXAM_TYPE_LABELS ? examTypeRaw : undefined;

  const records = parseFileToRecords(await file.arrayBuffer());
  if (!records.length) {
    return NextResponse.json({ message: "未识别到有效数据，请确认首行表头包含姓名与社会/成绩列" }, { status: 400 });
  }

  const existingExam = await prisma.exam.findUnique({
    where: { name: examName },
    include: {
      scores: {
        select: {
          student: { select: { graduated: true } }
        }
      }
    }
  });

  if (existingExam?.isMultiSubject) {
    return NextResponse.json(
      { message: "该考试名称已用于五科成绩，请换一个社会考试名称" },
      { status: 409 }
    );
  }
  if (existingExam?.scores.some((score) => score.student.graduated)) {
    return NextResponse.json(
      { message: "该考试名称属于毕业归档，请使用新的考试名称" },
      { status: 409 }
    );
  }

  const exam = existingExam
    ? await prisma.exam.update({
        where: { id: existingExam.id },
        data: { date: new Date(examDate), examType }
      })
    : await prisma.exam.create({
        data: { name: examName, date: new Date(examDate), isMultiSubject: false, examType }
      });

  const existingStudents = classInfo.students;
  const studentMap = new Map(existingStudents.map((s) => [normalizeName(s.name), s]));

  const uniqueByName = new Map<string, { name: string; score: number; isAbsent: boolean }>();
  for (const record of records) {
    uniqueByName.set(normalizeName(record.name), {
      name: record.name,
      score: record.score,
      isAbsent: record.isAbsent
    });
  }

  let createdStudents = 0;
  let savedScores = 0;

  for (const [normalizedName, record] of uniqueByName.entries()) {
    let student = studentMap.get(normalizedName);
    if (!student) {
      student = await prisma.student.create({
        data: { classId, name: record.name }
      });
      studentMap.set(normalizedName, student);
      createdStudents += 1;
    }

    await prisma.score.upsert({
      where: {
        studentId_examId_subject: {
          studentId: student.id,
          examId: exam.id,
          subject: "SOCIAL"
        }
      },
      update: { score: record.score, isAbsent: record.isAbsent, classId },
      create: { classId, studentId: student.id, examId: exam.id, subject: "SOCIAL", score: record.score, isAbsent: record.isAbsent }
    });
    savedScores += 1;
  }

  return NextResponse.json({
    message: `导入完成：新增考生 ${createdStudents} 人，写入成绩 ${savedScores} 条`
  });
}
