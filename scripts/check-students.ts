import { prisma } from "@/lib/prisma";

async function main() {
  const homeroom = await prisma.class.findFirst({ where: { isHomeroom: true } });
  console.log("班主任班级:", homeroom?.name, homeroom?.id);
  
  if (homeroom) {
    const students = await prisma.student.findMany({
      where: { classId: homeroom.id },
      orderBy: { name: "asc" }
    });
    console.log("该班所有学生:", students.length, "人");
    console.log(JSON.stringify(students.map((s) => s.name)));
    
    const wukeScores = await prisma.score.findMany({
      where: { classId: homeroom.id, subject: { not: "SOCIAL" } },
      include: { exam: true }
    });
    console.log("\n五科成绩记录数:", wukeScores.length);
    
    const exams = await prisma.exam.findMany({ where: { isMultiSubject: true } });
    console.log("\n多科考试:", exams.map((e) => e.name));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
