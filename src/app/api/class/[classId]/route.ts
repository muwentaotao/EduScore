import { NextRequest, NextResponse } from "next/server";
import { getArchivedClassDetail, getClassDetail } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/class/[classId]">) {
  const { classId } = await context.params;
  const archived = request.nextUrl.searchParams.get("scope") === "archived";
  const data = archived ? await getArchivedClassDetail(classId) : await getClassDetail(classId);

  if (!data) {
    return NextResponse.json(
      { message: archived ? "毕业归档班级不存在" : "当前班级不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function DELETE(_: NextRequest, context: RouteContext<"/api/class/[classId]">) {
  const { classId } = await context.params;
  const found = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: { select: { graduated: true } }
    }
  });

  if (!found) {
    return NextResponse.json({ message: "班级不存在" }, { status: 404 });
  }

  const isArchived = found.students.length > 0 && found.students.every((student) => student.graduated);
  if (isArchived) {
    return NextResponse.json(
      { message: "毕业归档班级不能删除，历史学生和成绩需要保留" },
      { status: 409 }
    );
  }

  await prisma.class.delete({ where: { id: classId } });
  return NextResponse.json({ message: "班级已删除" });
}
