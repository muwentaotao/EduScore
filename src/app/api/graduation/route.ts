import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await prisma.student.updateMany({
    where: { graduated: false },
    data: { graduated: true }
  });

  return NextResponse.json({
    message: `已将 ${result.count} 名学生标记为毕业并归档`
  });
}
