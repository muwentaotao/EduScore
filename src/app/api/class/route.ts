import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const classes = await prisma.class.findMany({
    include: {
      _count: { select: { students: true } }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(
    classes.map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      studentCount: item._count.students
    })),
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { name?: string; color?: string };
  const name = payload.name?.trim();
  const color = payload.color?.trim() || "#38bdf8";

  if (!name) {
    return NextResponse.json({ message: "班级名称不能为空" }, { status: 400 });
  }

  const exists = await prisma.class.findUnique({ where: { name } });
  if (exists) {
    return NextResponse.json({ message: "班级名称已存在" }, { status: 400 });
  }

  const classItem = await prisma.class.create({ data: { name, color } });
  return NextResponse.json(classItem);
}
