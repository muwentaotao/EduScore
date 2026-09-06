import { NextRequest, NextResponse } from "next/server";
import { getAnalysisData } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function exportArchivedClass(examId: string, classId: string) {
  const [classInfo, exam] = await Promise.all([
    prisma.class.findFirst({
      where: {
        id: classId,
        students: {
          some: { graduated: true },
          none: { graduated: false }
        }
      },
      select: { id: true, name: true }
    }),
    prisma.exam.findFirst({
      where: {
        id: examId,
        isMultiSubject: false,
        scores: {
          some: {
            classId,
            subject: "SOCIAL",
            student: { graduated: true }
          }
        }
      },
      select: { id: true }
    })
  ]);

  if (!classInfo || !exam) {
    return NextResponse.json({ message: "归档班级或考试不存在" }, { status: 404 });
  }

  const students = await prisma.student.findMany({
    where: {
      classId,
      graduated: true
    },
    include: {
      scores: {
        where: { examId, subject: "SOCIAL" },
        select: { score: true, isAbsent: true }
      }
    }
  });
  const rows = students.map((student) => ({ student, score: student.scores[0] ?? null }));
  const ranked = rows
    .filter((row) => row.score && !row.score.isAbsent)
    .sort((a, b) =>
      b.score!.score - a.score!.score || a.student.name.localeCompare(b.student.name, "zh-CN")
    );
  const withoutScore = rows
    .filter((row) => !row.score || row.score.isAbsent)
    .sort((a, b) => a.student.name.localeCompare(b.student.name, "zh-CN"));
  const lines = ["排名,姓名,班级,分数"];

  ranked.forEach((row, index) => {
    lines.push(
      [index + 1, row.student.name, classInfo.name, row.score!.score].map(csvCell).join(",")
    );
  });
  withoutScore.forEach((row) => {
    lines.push(
      ["", row.student.name, classInfo.name, row.score?.isAbsent ? "缺考" : "-"]
        .map(csvCell)
        .join(",")
    );
  });

  return new NextResponse(`\uFEFF${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"archived-grade-ranking.csv\"",
      "Cache-Control": "no-store"
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId") ?? undefined;
  const classId = searchParams.get("classId") ?? undefined;

  if (searchParams.get("scope") === "archived") {
    if (!examId || !classId) {
      return NextResponse.json({ message: "请选择归档班级和考试" }, { status: 400 });
    }
    return exportArchivedClass(examId, classId);
  }

  const data = await getAnalysisData(examId);

  const lines = ["排名,姓名,班级,分数"];
  for (const row of data.rankings) {
    lines.push(`${row.rank},${row.studentName},${row.className},${row.score}`);
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"grade-ranking.csv\"",
      "Cache-Control": "no-store"
    }
  });
}
