import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudentDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: RouteContext<"/api/students/[studentId]">) {
  const { studentId } = await context.params;
  const data = await getStudentDetail(studentId);
  if (!data) {
    return NextResponse.json({ message: "学生不存在" }, { status: 404 });
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest, context: RouteContext<"/api/students/[studentId]">) {
  const { studentId } = await context.params;
  const payload = (await request.json()) as { name?: string; classId?: string };

  const found = await prisma.student.findUnique({ where: { id: studentId } });
  if (!found) {
    return NextResponse.json({ message: "学生不存在" }, { status: 404 });
  }

  const data: { name?: string; classId?: string } = {};
  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) {
      return NextResponse.json({ message: "姓名不能为空" }, { status: 400 });
    }
    data.name = name;
  }
  if (payload.classId !== undefined) {
    const classInfo = await prisma.class.findUnique({ where: { id: payload.classId } });
    if (!classInfo) {
      return NextResponse.json({ message: "目标班级不存在" }, { status: 400 });
    }
    data.classId = payload.classId;
  }

  const updated = await prisma.student.update({ where: { id: studentId }, data });
  return NextResponse.json({ id: updated.id, name: updated.name, classId: updated.classId });
}

export async function DELETE(_: NextRequest, context: RouteContext<"/api/students/[studentId]">) {
  const { studentId } = await context.params;
  const found = await prisma.student.findUnique({ where: { id: studentId } });
  if (!found) {
    return NextResponse.json({ message: "学生不存在" }, { status: 404 });
  }

  await prisma.student.delete({ where: { id: studentId } });
  return NextResponse.json({ message: "学生及其成绩已删除" });
}
