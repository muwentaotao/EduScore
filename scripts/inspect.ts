import { prisma } from "@/lib/prisma";

async function main() {
  const exams = await prisma.exam.findMany();
  console.log("=== 所有考试 ===");
  console.log(JSON.stringify(exams, null, 2));

  const wukeScores = await prisma.score.findMany({
    where: { subject: { not: "SOCIAL" } },
    take: 5
  });
  console.log("\n=== 非社会科成绩(前5条) ===");
  console.log(JSON.stringify(wukeScores, null, 2));

  const socialScores = await prisma.score.findMany({
    where: { subject: "SOCIAL" },
    take: 3
  });
  console.log("\n=== 社会科成绩(前3条) ===");
  console.log(JSON.stringify(socialScores, null, 2));

  const homeroom = await prisma.class.findFirst({ where: { isHomeroom: true } });
  console.log("\n=== 班主任班级 ===");
  console.log(JSON.stringify(homeroom, null, 2));

  const scoreCount = await prisma.score.groupBy({
    by: ["subject"],
    _count: true
  });
  console.log("\n=== 各科目成绩数量 ===");
  console.log(JSON.stringify(scoreCount, null, 2));

  const wukeExamScores = await prisma.score.findMany({
    where: { exam: { isMultiSubject: true } },
    take: 5,
    include: { exam: true, student: true }
  });
  console.log("\n=== 多科考试关联成绩(前5条) ===");
  console.log(JSON.stringify(wukeExamScores, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
