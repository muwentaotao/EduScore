import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudentList } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const students = await getStudentList();
  return NextResponse.json(students, {
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { name?: string; classId?: string };
  const name = payload.name?.trim();
  const classId = payload.classId?.trim();

  if (!name || !classId) {
    return NextResponse.json({ message: "姓名和班级不能为空" }, { status: 400 });
  }

  const classInfo = await prisma.class.findUnique({ where: { id: classId } });
  if (!classInfo) {
    return NextResponse.json({ message: "班级不存在" }, { status: 400 });
  }

  const student = await prisma.student.create({ data: { name, classId } });
  return NextResponse.json({ id: student.id, name: student.name, classId: student.classId });
}
