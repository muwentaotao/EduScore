import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
  const classes = await prisma.class.findMany({
    include: {
      _count: { select: { students: true } },
      students: {
        where: { graduated: false },
        select: { id: true }
      }
    },
    orderBy: { name: "asc" }
  });

  const items = classes.map((item) => {
    const activeStudentCount = item.students.length;
    const graduatedStudentCount = item._count.students - activeStudentCount;
    return {
      id: item.id,
      name: item.name,
      color: item.color,
      studentCount: activeStudentCount,
      graduatedStudentCount,
      archived: activeStudentCount === 0 && graduatedStudentCount > 0
    };
  });

  return NextResponse.json(
    includeArchived ? items : items.filter((item) => !item.archived),
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
