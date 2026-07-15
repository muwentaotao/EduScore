-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('CHINESE', 'MATH', 'ENGLISH', 'SCIENCE', 'SOCIAL');

-- AlterTable: add subject column with default SOCIAL so existing social scores are tagged
ALTER TABLE "Score" ADD COLUMN "subject" "Subject" NOT NULL DEFAULT 'SOCIAL';

-- AlterTable: add isHomeroom flag on Class
ALTER TABLE "Class" ADD COLUMN "isHomeroom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add isMultiSubject flag on Exam
ALTER TABLE "Exam" ADD COLUMN "isMultiSubject" BOOLEAN NOT NULL DEFAULT false;

-- Drop old unique index (studentId, examId) and replace with (studentId, examId, subject)
DROP INDEX "Score_studentId_examId_key";
CREATE UNIQUE INDEX "Score_studentId_examId_subject_key" ON "Score"("studentId", "examId", "subject");

-- CreateIndex for subject filtering
CREATE INDEX "Score_subject_idx" ON "Score"("subject");
