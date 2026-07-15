import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudentList } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (q) {
    const students = await prisma.student.findMany({
      where: { name: { contains: q }, graduated: false },
      include: { class: true },
      take: 20
    });
    return NextResponse.json(
      students.map((s) => ({
        id: s.id,
        name: s.name,
        className: s.class.name,
        classColor: s.class.color
      })),
      { headers: { "Cache-Control": "no-store" } }
    );
  }
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
