import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWukeFileToRecords } from "@/lib/import";
import type { ExamType, Subject } from "@prisma/client";
import { SUBJECT_ORDER, EXAM_TYPE_LABELS } from "@/lib/subject";

export const dynamic = "force-dynamic";

function normalizeName(name: string) {
  return name.replace(/\s+/g, "").toLowerCase();
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const examName = String(formData.get("examName") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "").trim();
  const examTypeRaw = String(formData.get("examType") ?? "").trim() as ExamType;

  if (!file || !examName || !examDate) {
    return NextResponse.json({ message: "请填写考试名称、考试日期并上传成绩文件" }, { status: 400 });
  }

  const examType = examTypeRaw && examTypeRaw in EXAM_TYPE_LABELS ? examTypeRaw : undefined;

  const records = parseWukeFileToRecords(await file.arrayBuffer());
  if (!records.length) {
    return NextResponse.json({ message: "未识别到有效数据，请确认表头包含姓名及五科成绩列" }, { status: 400 });
  }

  const homeroom = await prisma.class.findFirst({ where: { isHomeroom: true } });
  if (!homeroom) {
    return NextResponse.json({ message: "尚未设置班主任班级，请先在班级管理中设置" }, { status: 400 });
  }

  const exam = await prisma.exam.upsert({
    where: { name: examName },
    update: { date: new Date(examDate), isMultiSubject: true, examType },
    create: { name: examName, date: new Date(examDate), isMultiSubject: true, examType }
  });

  const studentCache = new Map<string, { id: string; classId: string }>();
  let createdStudents = 0;
  let savedScores = 0;

  for (const record of records) {
    const studentKey = normalizeName(record.name);
    let student = studentCache.get(studentKey);
    if (!student) {
      const existing = await prisma.student.findFirst({
        where: { classId: homeroom.id, name: record.name }
      });
      if (existing) {
        student = { id: existing.id, classId: homeroom.id };
      } else {
        const created = await prisma.student.create({
          data: { classId: homeroom.id, name: record.name }
        });
        student = { id: created.id, classId: homeroom.id };
        createdStudents += 1;
      }
      studentCache.set(studentKey, student);
    }

    for (const subject of SUBJECT_ORDER) {
      const cell = record.scores[subject];
      if (!cell) continue;

      await prisma.score.upsert({
        where: {
          studentId_examId_subject: {
            studentId: student.id,
            examId: exam.id,
            subject
          }
        },
        update: { score: cell.score, isAbsent: cell.isAbsent, classId: student.classId, gradeRank: record.gradeRank },
        create: {
          classId: student.classId,
          studentId: student.id,
          examId: exam.id,
          subject: subject as Subject,
          score: cell.score,
          isAbsent: cell.isAbsent,
          gradeRank: record.gradeRank
        }
      });
      savedScores += 1;
    }
  }

  return NextResponse.json({
    message: `导入完成：班主任班级「${homeroom.name}」，新增考生 ${createdStudents} 人，写入成绩 ${savedScores} 条`
  });
}
