import { prisma } from "@/lib/prisma";

async function main() {
  const homeroom = await prisma.class.findFirst({ where: { isHomeroom: true } });
  if (!homeroom) return;

  const badNames = ["嘉兴市", "市"];
  for (const name of badNames) {
    const student = await prisma.student.findFirst({
      where: { classId: homeroom.id, name }
    });
    if (student) {
      await prisma.student.delete({ where: { id: student.id } });
      console.log(`已删除学生: ${name}`);
    } else {
      console.log(`未找到学生: ${name}`);
    }
  }

  const remaining = await prisma.student.count({ where: { classId: homeroom.id } });
  console.log(`该班剩余学生数: ${remaining}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
