import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const payload = (await request.json()) as { classId?: string };
  const classId = payload.classId?.trim();

  if (!classId) {
    return NextResponse.json({ message: "班级ID不能为空" }, { status: 400 });
  }

  const target = await prisma.class.findUnique({ where: { id: classId } });
  if (!target) {
    return NextResponse.json({ message: "班级不存在" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.class.updateMany({ data: { isHomeroom: false } }),
    prisma.class.update({ where: { id: classId }, data: { isHomeroom: true } })
  ]);

  return NextResponse.json({ message: `已将「${target.name}」设为班主任班级` });
}
