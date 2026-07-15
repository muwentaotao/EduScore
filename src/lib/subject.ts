import type { ExamType, Subject } from "@prisma/client";

export const SUBJECT_ORDER: Subject[] = ["CHINESE", "MATH", "ENGLISH", "SCIENCE", "SOCIAL"];

export const EXAM_TYPE_ORDER: ExamType[] = ["MIDTERM", "FINAL", "MOCK", "MONTHLY", "WEEKLY"];

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MONTHLY: "月考",
  MIDTERM: "期中",
  FINAL: "期末",
  WEEKLY: "周测",
  MOCK: "模拟考"
};

export const EXAM_TYPE_COLORS: Record<ExamType, string> = {
  MONTHLY: "#3b82f6",
  MIDTERM: "#8b5cf6",
  FINAL: "#ef4444",
  WEEKLY: "#10b981",
  MOCK: "#f59e0b"
};

export function examTypeLabel(type: ExamType | null | undefined): string {
  if (!type) return "未分类";
  return EXAM_TYPE_LABELS[type];
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  CHINESE: "语文",
  MATH: "数学",
  ENGLISH: "英语",
  SCIENCE: "科学",
  SOCIAL: "社会"
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  CHINESE: "#ef4444",
  MATH: "#3b82f6",
  ENGLISH: "#8b5cf6",
  SCIENCE: "#10b981",
  SOCIAL: "#f59e0b"
};

export const SUBJECT_KEYWORDS: Record<Subject, string[]> = {
  CHINESE: ["语文", "语文成绩", "chinese"],
  MATH: ["数学", "数学成绩", "math"],
  ENGLISH: ["英语", "英文", "english"],
  SCIENCE: ["科学", "科学成绩", "science"],
  SOCIAL: ["社会", "道法", "政史", "政治", "social"]
};

export function subjectLabel(subject: Subject): string {
  return SUBJECT_LABELS[subject];
}
