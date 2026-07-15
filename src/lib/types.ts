import type { ExamType, Subject } from "@prisma/client";

export type ScoreMap = Record<string, number | null>;

export type DashboardStudentRow = {
  studentId: string;
  classId: string;
  className: string;
  classColor: string;
  studentName: string;
  scores: ScoreMap;
  progressDelta: number | null;
  rank: number;
  sparkline: number[];
};

export type ClassDetail = {
  classId: string;
  className: string;
  classColor: string;
  examHeaders: { id: string; name: string; date: string }[];
  averageByExam: { examId: string; examName: string; average: number }[];
  students: Array<{
    studentId: string;
    studentName: string;
    scores: ScoreMap;
    absentByExam: Record<string, boolean>;
  }>;
};

export type StudentListItem = {
  id: string;
  name: string;
  classId: string;
  className: string;
  classColor: string;
  examCount: number;
  latestScore: number | null;
  createdAt: string;
};

export type StudentDetail = {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  classColor: string;
  exams: { id: string; name: string; date: string }[];
  records: Array<{
    examId: string;
    examName: string;
    examDate: string;
    score: number | null;
    isAbsent: boolean;
    rank: number | null;
    totalStudents: number;
    classAverage: number;
  }>;
  rankHistory: Array<{ exam: string; rank: number | null; score: number | null; classAverage: number }>;
};

export type ClassComparisonData = {
  exams: { id: string; name: string; date: string }[];
  metrics: Array<{
    classId: string;
    className: string;
    classColor: string;
    byExam: Array<{ examId: string; average: number; passRate: number; excellentRate: number }>;
  }>;
};

export type DashboardData = {
  classes: Array<{
    id: string;
    name: string;
    color: string;
    studentCount: number;
    latestAverage: number | null;
  }>;
  exams: { id: string; name: string; date: string }[];
  rows: DashboardStudentRow[];
  classTrends: Array<{
    classId: string;
    className: string;
    classColor: string;
    points: Array<{ examId: string; examName: string; average: number | null }>;
  }>;
};

export type AnalysisPageData = {
  selectedExamId: string;
  exams: { id: string; name: string; date: string }[];
  classAverages: { classId: string; className: string; classColor: string; average: number }[];
  distribution: { bucket: string; count: number }[];
  rankings: Array<{
    rank: number;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    classColor: string;
    score: number;
  }>;
  improveTop5: Array<{
    studentId: string;
    studentName: string;
    className: string;
    classColor: string;
    currentRank: number;
    previousRank: number;
    rankDelta: number;
    currentScore: number;
    previousScore: number;
    scoreDelta: number;
  }>;
  declineTop5: Array<{
    studentId: string;
    studentName: string;
    className: string;
    classColor: string;
    currentRank: number;
    previousRank: number;
    rankDelta: number;
    currentScore: number;
    previousScore: number;
    scoreDelta: number;
  }>;
  examProgressTop5: Array<{
    examId: string;
    examName: string;
    previousExamName: string;
    rows: Array<{
      studentId: string;
      studentName: string;
      className: string;
      classColor: string;
      previousRank: number;
      currentRank: number;
      rankDelta: number;
      previousScore: number;
      currentScore: number;
      scoreDelta: number;
    }>;
  }>;
  classComparison: ClassComparisonData;
};

export type WukeExamItem = {
  id: string;
  name: string;
  date: string;
  examType: ExamType | null;
};

export type WukeScoreCell = {
  score: number | null;
  isAbsent: boolean;
  subjectRank: number | null;
};

export type WukeStudentRow = {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  classColor: string;
  subjects: Record<Subject, WukeScoreCell>;
  totalScore: number | null;
  classRank: number;
  classRankDelta: number | null;
  gradeRank: number | null;
  gradeRankDelta: number | null;
  warnings: WukeWarningType[];
};

export type WukeWarningType = "rankDropLarge" | "rankDropConsecutive";

export type WukeSummary = {
  totalAverage: number;
  subjectAverages: Record<Subject, number>;
  maxTotal: number;
  minTotal: number;
  participantCount: number;
  absentCount: number;
  passRate: number;
  excellentRate: number;
};

export type WukeScoreReport = {
  examId: string;
  examName: string;
  examDate: string;
  classId: string;
  className: string;
  classColor: string;
  isHomeroom: boolean;
  summary: WukeSummary;
  students: WukeStudentRow[];
  previousExamId: string | null;
};

export type WukeComparisonRow = {
  studentId: string;
  studentName: string;
  subjects: Record<Subject, {
    current: number | null;
    currentAbsent: boolean;
    previous: number | null;
    previousAbsent: boolean;
    delta: number | null;
  }>;
  currentTotal: number | null;
  previousTotal: number | null;
  currentClassRank: number | null;
  previousClassRank: number | null;
  classRankDelta: number | null;
  currentGradeRank: number | null;
  previousGradeRank: number | null;
  gradeRankDelta: number | null;
};

export type WukeComparisonData = {
  currentExamId: string;
  currentExamName: string;
  previousExamId: string;
  previousExamName: string;
  rows: WukeComparisonRow[];
};

export type WukeWarningRow = {
  studentId: string;
  studentName: string;
  className: string;
  classColor: string;
  totalScore: number;
  classRank: number;
  previousClassRank: number | null;
  classRankDelta: number | null;
  warnings: WukeWarningType[];
};

export type WukePageData = {
  homeroomClassId: string | null;
  homeroomClassName: string | null;
  homeroomClassColor: string | null;
  exams: WukeExamItem[];
  report: WukeScoreReport | null;
  comparison: WukeComparisonData | null;
  warnings: WukeWarningRow[];
};

export type WukeStudentHistoryPoint = {
  examId: string;
  examName: string;
  examDate: string;
  examType: ExamType | null;
  subjects: Record<Subject, { score: number | null; isAbsent: boolean; classAverage: number }>;
  totalScore: number | null;
  classTotalAverage: number;
  classRank: number | null;
  participantCount: number;
};

export type WukeStudentHistory = {
  studentId: string;
  studentName: string;
  className: string;
  classColor: string;
  points: WukeStudentHistoryPoint[];
  recommendations: Array<{
    subject: Subject;
    avgGap: number;
    attendedCount: number;
  }>;
};
