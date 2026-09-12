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
