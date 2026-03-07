import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const baseClasses = [
  { name: "九年级(1)班", color: "#38bdf8" },
  { name: "九年级(2)班", color: "#34d399" },
  { name: "九年级(3)班", color: "#fbbf24" }
];

async function main() {
  await prisma.score.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();

  for (const classItem of baseClasses) {
    await prisma.class.create({ data: classItem });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
