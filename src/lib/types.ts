export type ScoreMap = Record<string, number | null>;

export type DashboardStudentRow = {
  studentId: string;
  classId: string;
  className: string;
  studentName: string;
  scores: ScoreMap;
  progressDelta: number | null;
  rank: number;
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

export type AnalysisPageData = {
  selectedExamId: string;
  exams: { id: string; name: string; date: string }[];
  classAverages: { classId: string; className: string; average: number }[];
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
    current: number;
    previous: number;
    delta: number;
  }>;
  declineTop5: Array<{
    studentId: string;
    studentName: string;
    className: string;
    current: number;
    previous: number;
    delta: number;
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
      previous: number;
      current: number;
      delta: number;
    }>;
  }>;
};
