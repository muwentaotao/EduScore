-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('MONTHLY', 'MIDTERM', 'FINAL', 'WEEKLY', 'MOCK');

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "examType" "ExamType";
