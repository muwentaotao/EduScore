import { NextRequest, NextResponse } from "next/server";
import { getClassDetail } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: RouteContext<"/api/class/[classId]">) {
  const { classId } = await context.params;
  const data = await getClassDetail(classId);

  if (!data) {
    return NextResponse.json({ message: "班级不存在" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function DELETE(_: NextRequest, context: RouteContext<"/api/class/[classId]">) {
  const { classId } = await context.params;
  const found = await prisma.class.findUnique({ where: { id: classId } });

  if (!found) {
    return NextResponse.json({ message: "班级不存在" }, { status: 404 });
  }

  await prisma.class.delete({ where: { id: classId } });
  return NextResponse.json({ message: "班级已删除" });
}
