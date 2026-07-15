-- AlterTable: add optional gradeRank column on Score (uploaded from Excel, null if not provided)
ALTER TABLE "Score" ADD COLUMN "gradeRank" INTEGER;
