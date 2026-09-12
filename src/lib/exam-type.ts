import type { ExamType } from "@prisma/client";

export const EXAM_TYPE_ORDER: ExamType[] = ["MIDTERM", "FINAL", "MOCK", "MONTHLY", "WEEKLY"];

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MONTHLY: "月考",
  MIDTERM: "期中",
  FINAL: "期末",
  WEEKLY: "周测",
  MOCK: "模拟考"
};
