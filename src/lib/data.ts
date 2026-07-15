import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import type { Subject } from "@prisma/client";
import type {
  AnalysisPageData,
  ClassComparisonData,
  ClassDetail,
  DashboardData,
  DashboardStudentRow,
  ScoreMap,
  StudentDetail,
  StudentListItem,
  WukeComparisonData,
  WukeExamItem,
  WukePageData,
  WukeScoreReport,
  WukeStudentHistory,
  WukeStudentHistoryPoint,
  WukeStudentRow,
  WukeSummary,
  WukeWarningRow,
  WukeWarningType
} from "@/lib/types";
import { SUBJECT_ORDER } from "@/lib/subject";
import { toFixed } from "@/lib/utils";

function avg(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return toFixed(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function createRankMap(rows: Array<{ studentId: string; score: number }>) {
  return new Map(
    [...rows]
      .sort((a, b) => b.score - a.score)
      .map((row, index) => [row.studentId, index + 1] as const)
  );
}

export async function getDashboardData(): Promise<DashboardData> {
  noStore();
  const [classes, exams, students] = await Promise.all([
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.exam.findMany({ where: { isMultiSubject: false }, orderBy: { date: "asc" } }),
    prisma.student.findMany({
      where: { graduated: false },
      include: {
        class: true,
        scores: {
          where: { subject: "SOCIAL" },
          include: {
            exam: true
          }
        }
      },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }]
    })
  ]);

  type RowWithMetric = DashboardStudentRow & { rankMetric: number };
  const rows: RowWithMetric[] = students.map((student) => {
    const scores: ScoreMap = {};
    for (const exam of exams) {
      const hit = student.scores.find((item) => item.examId === exam.id);
      scores[exam.id] = hit && !hit.isAbsent ? hit.score : null;
    }
    const numeric = Object.values(scores).filter((v): v is number => typeof v === "number");
    const latestScore = numeric.at(-1) ?? null;
    const previousScore = numeric.length >= 2 ? numeric.at(-2) ?? null : null;
    const progressDelta =
      latestScore !== null && previousScore !== null ? toFixed(latestScore - previousScore) : null;
    return {
      studentId: student.id,
      classId: student.classId,
      className: student.class.name,
      classColor: student.class.color,
      studentName: student.name,
      scores,
      progressDelta,
      rankMetric: progressDelta ?? -9999,
      rank: 0,
      sparkline: numeric.slice(-6)
    };
  });

  rows
    .sort((a, b) => b.rankMetric - a.rankMetric)
    .forEach((row, index) => {
      row.rank = index + 1;
    });

  const classTrends = classes.map((cls) => {
    const classStudents = students.filter((s) => s.classId === cls.id);
    const points = exams.map((exam) => {
      const values = classStudents
        .map((s) => s.scores.find((sc) => sc.examId === exam.id && !sc.isAbsent)?.score)
        .filter((v): v is number => typeof v === "number");
      return { examId: exam.id, examName: exam.name, average: values.length > 0 ? avg(values) : null };
    });
    return { classId: cls.id, className: cls.name, classColor: cls.color, points };
  });

  return {
    classes: classes.map((item) => {
      const latestPoint = classTrends.find((t) => t.classId === item.id)?.points.at(-1);
      return {
        id: item.id,
        name: item.name,
        color: item.color,
        studentCount: rows.filter((row) => row.classId === item.id).length,
        latestAverage: latestPoint?.average ?? null
      };
    }),
    exams: exams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      date: exam.date.toISOString().slice(0, 10)
    })),
    rows: rows.map(({ rankMetric, ...row }) => row),
    classTrends
  };
}

export async function getClassDetail(classId: string): Promise<ClassDetail | null> {
  noStore();
  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: {
        where: { graduated: false },
        include: {
          scores: {
            where: { subject: "SOCIAL" },
            include: {
              exam: true
            }
          }
        },
        orderBy: { name: "asc" }
      }
    }
  });

  if (!classInfo) {
    return null;
  }

  const exams = await prisma.exam.findMany({ where: { isMultiSubject: false }, orderBy: { date: "asc" } });
  const averageByExam = exams.map((exam) => {
    const values = classInfo.students
      .map((student) => {
        const row = student.scores.find((score) => score.examId === exam.id);
        return row && !row.isAbsent ? row.score : null;
      })
      .filter((item): item is number => item !== null);
    return {
      examId: exam.id,
      examName: exam.name,
      average: avg(values)
    };
  });

  const students = classInfo.students.map((student) => {
    const scores: ScoreMap = {};
    const absentByExam: Record<string, boolean> = {};
    for (const exam of exams) {
      const found = student.scores.find((score) => score.examId === exam.id);
      scores[exam.id] = found && !found.isAbsent ? found.score : null;
      absentByExam[exam.id] = Boolean(found?.isAbsent);
    }
    return {
      studentId: student.id,
      studentName: student.name,
      scores,
      absentByExam
    };
  });

  return {
    classId: classInfo.id,
    className: classInfo.name,
    classColor: classInfo.color,
    examHeaders: exams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      date: exam.date.toISOString().slice(0, 10)
    })),
    averageByExam,
    students
  };
}

export async function getAnalysisData(examId?: string): Promise<AnalysisPageData> {
  noStore();
  const [exams, classes] = await Promise.all([
    prisma.exam.findMany({ where: { isMultiSubject: false }, orderBy: { date: "asc" } }),
    prisma.class.findMany({ orderBy: { name: "asc" } })
  ]);

  const selected = exams.find((item) => item.id === examId) ?? exams[exams.length - 1];
  if (!selected) {
    return {
      selectedExamId: "",
      exams: [],
      classAverages: [],
      distribution: [],
      rankings: [],
      improveTop5: [],
      declineTop5: [],
      examProgressTop5: [],
      classComparison: { exams: [], metrics: [] }
    };
  }

  const scores = await prisma.score.findMany({
    where: { examId: selected.id, isAbsent: false, subject: "SOCIAL" },
    include: {
      student: {
        include: {
          class: true
        }
      }
    }
  });

  const classAverages = classes.map((classItem) => {
    const classScores = scores.filter((item) => item.classId === classItem.id).map((item) => item.score);
    return {
      classId: classItem.id,
      className: classItem.name,
      classColor: classItem.color,
      average: avg(classScores)
    };
  });

  const distributionBuckets = [
    { key: "90-100", min: 90, max: 100 },
    { key: "70-89", min: 70, max: 89.99 },
    { key: "60-69", min: 60, max: 69.99 },
    { key: "<60", min: 0, max: 59.99 }
  ];
  const distribution = distributionBuckets.map((bucket) => ({
    bucket: bucket.key,
    count: scores.filter((item) => item.score >= bucket.min && item.score <= bucket.max).length
  }));

  const rankings = scores
    .map((item) => ({
      rank: 0,
      studentId: item.studentId,
      studentName: item.student.name,
      classId: item.classId,
      className: item.student.class.name,
      classColor: item.student.class.color,
      score: item.score
    }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const selectedIndex = exams.findIndex((item) => item.id === selected.id);
  const prevExam = selectedIndex > 0 ? exams[selectedIndex - 1] : null;
  let improveTop5: AnalysisPageData["improveTop5"] = [];
  let declineTop5: AnalysisPageData["declineTop5"] = [];
  let examProgressTop5: AnalysisPageData["examProgressTop5"] = [];

  if (prevExam) {
    const prevScores = await prisma.score.findMany({
      where: { examId: prevExam.id, isAbsent: false, subject: "SOCIAL" },
      include: {
        student: {
          include: {
            class: true
          }
        }
      }
    });
    const currentRankMap = createRankMap(scores);
    const previousRankMap = createRankMap(prevScores);
    const previousScoreMap = new Map(prevScores.map((item) => [item.studentId, item.score]));
    const deltaRows = scores
      .filter((item) => previousScoreMap.has(item.studentId))
      .map((item) => {
        const previousScore = previousScoreMap.get(item.studentId);
        const currentRank = currentRankMap.get(item.studentId);
        const previousRank = previousRankMap.get(item.studentId);
        if (previousScore === undefined || currentRank === undefined || previousRank === undefined) {
          return null;
        }
        return {
          studentId: item.studentId,
          studentName: item.student.name,
          className: item.student.class.name,
          classColor: item.student.class.color,
          currentRank,
          previousRank,
          rankDelta: previousRank - currentRank,
          currentScore: item.score,
          previousScore,
          scoreDelta: toFixed(item.score - previousScore)
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    improveTop5 = [...deltaRows]
      .filter((row) => row.rankDelta > 0)
      .sort((a, b) => b.rankDelta - a.rankDelta)
      .slice(0, 5);
    declineTop5 = [...deltaRows]
      .filter((row) => row.rankDelta < 0)
      .sort((a, b) => a.rankDelta - b.rankDelta)
      .slice(0, 5);
  }

  if (exams.length > 1) {
    const scoreRows = await prisma.score.findMany({
      where: { isAbsent: false, subject: "SOCIAL" },
      include: {
        student: {
          include: {
            class: true
          }
        },
        exam: true
      }
    });

    const examScoreMap = new Map<string, Map<string, (typeof scoreRows)[number]>>();
    for (const exam of exams) {
      examScoreMap.set(exam.id, new Map());
    }
    for (const row of scoreRows) {
      examScoreMap.get(row.examId)?.set(row.studentId, row);
    }

    examProgressTop5 = exams
      .map((exam, index) => ({ exam, index }))
      .filter((item) => item.index > 0)
      .map(({ exam, index }) => {
        const previousExam = exams[index - 1];
        const currentMap = examScoreMap.get(exam.id) ?? new Map();
        const previousMap = examScoreMap.get(previousExam.id) ?? new Map();
        const currentRankMap = createRankMap([...currentMap.values()]);
        const previousRankMap = createRankMap([...previousMap.values()]);
        const rows = [...currentMap.values()]
          .filter((current) => previousMap.has(current.studentId))
          .map((current) => {
            const previous = previousMap.get(current.studentId)!;
            const currentRank = currentRankMap.get(current.studentId);
            const previousRank = previousRankMap.get(current.studentId);
            if (currentRank === undefined || previousRank === undefined) {
              return null;
            }
            return {
              studentId: current.studentId,
              studentName: current.student.name,
              className: current.student.class.name,
              classColor: current.student.class.color,
              previousRank,
              currentRank,
              rankDelta: previousRank - currentRank,
              previousScore: previous.score,
              currentScore: current.score,
              scoreDelta: toFixed(current.score - previous.score)
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null)
          .filter((row) => row.rankDelta > 0)
          .sort((a, b) => b.rankDelta - a.rankDelta)
          .slice(0, 5);

        return {
          examId: exam.id,
          examName: exam.name,
          previousExamName: previousExam.name,
          rows
        };
      });
  }

  return {
    selectedExamId: selected.id,
    exams: exams.map((item) => ({
      id: item.id,
      name: item.name,
      date: item.date.toISOString().slice(0, 10)
    })),
    classAverages,
    distribution,
    rankings,
    improveTop5,
    declineTop5,
    examProgressTop5,
    classComparison: await getClassComparisonData(exams.map((item) => ({
      id: item.id,
      name: item.name,
      date: item.date.toISOString().slice(0, 10)
    })))
  };
}

export async function getStudentList(): Promise<StudentListItem[]> {
  noStore();
  const students = await prisma.student.findMany({
    where: { graduated: false },
    include: {
      class: true,
      scores: { where: { subject: "SOCIAL" }, include: { exam: true } }
    },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }]
  });

  return students.map((student) => {
    const validScores = student.scores
      .filter((s) => !s.isAbsent)
      .sort((a, b) => a.exam.date.getTime() - b.exam.date.getTime());
    return {
      id: student.id,
      name: student.name,
      classId: student.classId,
      className: student.class.name,
      classColor: student.class.color,
      examCount: student.scores.length,
      latestScore: validScores.length > 0 ? validScores[validScores.length - 1].score : null,
      createdAt: student.createdAt.toISOString().slice(0, 10)
    };
  });
}

export async function getStudentDetail(studentId: string): Promise<StudentDetail | null> {
  noStore();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      scores: { where: { subject: "SOCIAL" }, include: { exam: true } }
    }
  });

  if (!student) return null;

  const exams = await prisma.exam.findMany({ where: { isMultiSubject: false }, orderBy: { date: "asc" } });

  const allScores = await prisma.score.findMany({
    where: { isAbsent: false, subject: "SOCIAL" },
    include: { student: { include: { class: true } } }
  });

  const records: StudentDetail["records"] = exams.map((exam) => {
    const examScores = allScores.filter((s) => s.examId === exam.id);
    const classScores = examScores.filter((s) => s.classId === student.classId);
    const sortedScores = [...examScores].sort((a, b) => b.score - a.score);
    const rankIndex = sortedScores.findIndex((s) => s.studentId === student.id);
    const studentScore = student.scores.find((s) => s.examId === exam.id);
    const isAbsent = studentScore?.isAbsent ?? false;
    const score = studentScore && !isAbsent ? studentScore.score : null;

    return {
      examId: exam.id,
      examName: exam.name,
      examDate: exam.date.toISOString().slice(0, 10),
      score,
      isAbsent,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      totalStudents: classScores.length,
      classAverage: avg(classScores.map((s) => s.score))
    };
  });

  const rankHistory = records.map((r) => ({
    exam: r.examName,
    rank: r.rank,
    score: r.score,
    classAverage: r.classAverage
  }));

  return {
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    className: student.class.name,
    classColor: student.class.color,
    exams: exams.map((e) => ({ id: e.id, name: e.name, date: e.date.toISOString().slice(0, 10) })),
    records,
    rankHistory
  };
}

export async function getClassComparisonData(exams: { id: string; name: string; date: string }[]): Promise<ClassComparisonData> {
  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });

  const allScores = await prisma.score.findMany({
    where: { isAbsent: false, subject: "SOCIAL" },
    include: { student: true }
  });

  const metrics = classes.map((cls) => {
    const byExam = exams.map((exam) => {
      const classScores = allScores.filter((s) => s.classId === cls.id && s.examId === exam.id);
      const scores = classScores.map((s) => s.score);
      const passCount = scores.filter((s) => s >= 60).length;
      const excellentCount = scores.filter((s) => s >= 90).length;
      return {
        examId: exam.id,
        average: avg(scores),
        passRate: scores.length > 0 ? toFixed((passCount / scores.length) * 100) : 0,
        excellentRate: scores.length > 0 ? toFixed((excellentCount / scores.length) * 100) : 0
      };
    });
    return {
      classId: cls.id,
      className: cls.name,
      classColor: cls.color,
      byExam
    };
  });

  return { exams, metrics };
}

const RANK_DROP_LARGE_THRESHOLD = 3;
const RANK_DROP_SMALL_MAX = 3;

function buildSubjectRankMap(rows: Array<{ studentId: string; subject: Subject; score: number }>, subject: Subject) {
  const filtered = rows.filter((r) => r.subject === subject);
  return new Map(
    [...filtered]
      .sort((a, b) => b.score - a.score)
      .map((row, index) => [row.studentId, index + 1] as const)
  );
}

function computeWarnings(
  classRankDelta: number | null,
  previousClassRankDelta: number | null
): WukeWarningType[] {
  const warnings: WukeWarningType[] = [];
  if (classRankDelta !== null && classRankDelta <= -(RANK_DROP_LARGE_THRESHOLD + 1)) {
    warnings.push("rankDropLarge");
  }
  if (
    classRankDelta !== null && classRankDelta < 0 && classRankDelta >= -RANK_DROP_SMALL_MAX &&
    previousClassRankDelta !== null && previousClassRankDelta < 0 && previousClassRankDelta >= -RANK_DROP_SMALL_MAX
  ) {
    warnings.push("rankDropConsecutive");
  }
  return warnings;
}

export async function getHomeroomClass(): Promise<{ id: string; name: string; color: string } | null> {
  noStore();
  const homeroom = await prisma.class.findFirst({ where: { isHomeroom: true } });
  return homeroom ? { id: homeroom.id, name: homeroom.name, color: homeroom.color } : null;
}

export async function getWukeExams(): Promise<WukeExamItem[]> {
  noStore();
  const exams = await prisma.exam.findMany({
    where: { isMultiSubject: true },
    orderBy: { date: "asc" }
  });
  return exams.map((exam) => ({
    id: exam.id,
    name: exam.name,
    date: exam.date.toISOString().slice(0, 10),
    examType: exam.examType
  }));
}

export async function getWukeScoreReport(examId: string, classId: string): Promise<WukeScoreReport | null> {
  noStore();
  const [exam, classInfo] = await Promise.all([
    prisma.exam.findUnique({ where: { id: examId } }),
    prisma.class.findUnique({ where: { id: classId } })
  ]);
  if (!exam || !classInfo) return null;

  const scores = await prisma.score.findMany({
    where: { examId, classId },
    include: { student: { include: { class: true } } }
  });

  const studentsInClass = await prisma.student.findMany({
    where: { classId, graduated: false },
    orderBy: { name: "asc" }
  });

  const previousExams = await prisma.exam.findMany({
    where: { isMultiSubject: true, date: { lt: exam.date } },
    orderBy: { date: "desc" }
  });
  const previousExam = previousExams[0] ?? null;
  const twoExamsAgo = previousExams[1] ?? null;

  const previousClassTotalMap = new Map<string, number>();
  const previousGradeRankMap = new Map<string, number>();
  if (previousExam) {
    const prevScoresAll = await prisma.score.findMany({
      where: { examId: previousExam.id, isAbsent: false }
    });
    for (const s of prevScoresAll) {
      if (s.classId === classId) {
        previousClassTotalMap.set(s.studentId, (previousClassTotalMap.get(s.studentId) ?? 0) + s.score);
      }
      if (s.gradeRank !== null && !previousGradeRankMap.has(s.studentId)) {
        previousGradeRankMap.set(s.studentId, s.gradeRank);
      }
    }
  }

  const twoExamsAgoClassTotalMap = new Map<string, number>();
  if (twoExamsAgo) {
    const prevPrevScores = await prisma.score.findMany({
      where: { examId: twoExamsAgo.id, classId, isAbsent: false }
    });
    for (const s of prevPrevScores) {
      twoExamsAgoClassTotalMap.set(s.studentId, (twoExamsAgoClassTotalMap.get(s.studentId) ?? 0) + s.score);
    }
  }

  const subjectRankMaps = new Map<Subject, Map<string, number>>();
  for (const subject of SUBJECT_ORDER) {
    const subjectRows = scores
      .filter((s) => s.subject === subject && !s.isAbsent)
      .map((s) => ({ studentId: s.studentId, subject: s.subject, score: s.score }));
    subjectRankMaps.set(subject, buildSubjectRankMap(subjectRows, subject));
  }

  const studentGradeRankMap = new Map<string, number>();
  for (const s of scores) {
    if (s.gradeRank !== null && !studentGradeRankMap.has(s.studentId)) {
      studentGradeRankMap.set(s.studentId, s.gradeRank);
    }
  }

  const rows: Array<WukeStudentRow & { totalMetric: number; totalDelta: number | null }> = studentsInClass.map((student) => {
    const subjects = {} as Record<Subject, WukeStudentRow["subjects"][Subject]>;
    let total = 0;
    let hasAny = false;
    for (const subject of SUBJECT_ORDER) {
      const hit = scores.find((s) => s.studentId === student.id && s.subject === subject);
      const score = hit && !hit.isAbsent ? hit.score : null;
      const isAbsent = hit?.isAbsent ?? false;
      const subjectRank = score !== null ? (subjectRankMaps.get(subject)?.get(student.id) ?? null) : null;
      subjects[subject] = { score, isAbsent, subjectRank };
      if (score !== null) {
        total += score;
        hasAny = true;
      }
    }
    const totalScore = hasAny ? total : null;
    const prevTotal = previousClassTotalMap.get(student.id) ?? null;
    const totalDelta = totalScore !== null && prevTotal !== null ? toFixed(totalScore - prevTotal) : null;

    return {
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      className: classInfo.name,
      classColor: classInfo.color,
      subjects,
      totalScore,
      classRank: 0,
      classRankDelta: null,
      gradeRank: studentGradeRankMap.get(student.id) ?? null,
      gradeRankDelta: null,
      totalMetric: totalScore ?? -1,
      totalDelta,
      warnings: []
    };
  });

  rows.sort((a, b) => b.totalMetric - a.totalMetric);
  rows.forEach((row, index) => {
    row.classRank = index + 1;
  });

  if (previousExam) {
    const prevClassRankList = rows
      .map((r) => ({ studentId: r.studentId, total: previousClassTotalMap.get(r.studentId) ?? -1 }))
      .sort((a, b) => b.total - a.total);
    const prevClassRankMap = new Map<string, number>();
    prevClassRankList.forEach((item, index) => {
      if (item.total >= 0) prevClassRankMap.set(item.studentId, index + 1);
    });

    let prevPrevClassRankMap = new Map<string, number>();
    if (twoExamsAgo) {
      const allPrevPrevStudents = await prisma.student.findMany({
        where: { classId, graduated: false }
      });
      const prevPrevRankList = allPrevPrevStudents
        .map((s) => ({ studentId: s.id, total: twoExamsAgoClassTotalMap.get(s.id) ?? -1 }))
        .sort((a, b) => b.total - a.total);
      prevPrevRankList.forEach((item, index) => {
        if (item.total >= 0) prevPrevClassRankMap.set(item.studentId, index + 1);
      });
    }

    rows.forEach((row) => {
      const prevClassRank = prevClassRankMap.get(row.studentId);
      if (prevClassRank !== undefined) {
        row.classRankDelta = prevClassRank - row.classRank;
      }
      const prevGradeRank = previousGradeRankMap.get(row.studentId);
      const currGradeRank = row.gradeRank;
      if (prevGradeRank !== undefined && currGradeRank !== null) {
        row.gradeRankDelta = prevGradeRank - currGradeRank;
      }

      let previousClassRankDelta: number | null = null;
      if (twoExamsAgo && prevClassRank !== undefined) {
        const prevPrevRank = prevPrevClassRankMap.get(row.studentId);
        if (prevPrevRank !== undefined) {
          previousClassRankDelta = prevPrevRank - prevClassRank;
        }
      }
      row.warnings = computeWarnings(row.classRankDelta, previousClassRankDelta);
    });
  } else {
    rows.forEach((row) => {
      row.warnings = computeWarnings(null, null);
    });
  }

  const validTotals = rows.map((r) => r.totalScore).filter((v): v is number => v !== null);
  const participantCount = validTotals.length;
  const absentCount = studentsInClass.length - participantCount;

  const subjectAverages = {} as Record<Subject, number>;
  for (const subject of SUBJECT_ORDER) {
    const values = rows
      .map((r) => (r.subjects[subject].isAbsent ? null : r.subjects[subject].score))
      .filter((v): v is number => v !== null);
    subjectAverages[subject] = avg(values);
  }

  const summary: WukeSummary = {
    totalAverage: avg(validTotals),
    subjectAverages,
    maxTotal: validTotals.length > 0 ? Math.max(...validTotals) : 0,
    minTotal: validTotals.length > 0 ? Math.min(...validTotals) : 0,
    participantCount,
    absentCount,
    passRate: participantCount > 0 ? toFixed((validTotals.filter((t) => t >= 300).length / participantCount) * 100) : 0,
    excellentRate: participantCount > 0 ? toFixed((validTotals.filter((t) => t >= 450).length / participantCount) * 100) : 0
  };

  return {
    examId: exam.id,
    examName: exam.name,
    examDate: exam.date.toISOString().slice(0, 10),
    classId: classInfo.id,
    className: classInfo.name,
    classColor: classInfo.color,
    isHomeroom: classInfo.isHomeroom,
    summary,
    students: rows.map(({ totalMetric, totalDelta: _td, ...row }) => row),
    previousExamId: previousExam?.id ?? null
  };
}

export async function getWukeComparison(currentExamId: string, previousExamId: string, classId: string): Promise<WukeComparisonData | null> {
  noStore();
  const [currentExam, previousExam, classInfo] = await Promise.all([
    prisma.exam.findUnique({ where: { id: currentExamId } }),
    prisma.exam.findUnique({ where: { id: previousExamId } }),
    prisma.class.findUnique({ where: { id: classId } })
  ]);
  if (!currentExam || !previousExam || !classInfo) return null;

  const [currentClassScores, previousClassScores, studentsInClass] = await Promise.all([
    prisma.score.findMany({ where: { examId: currentExamId, classId } }),
    prisma.score.findMany({ where: { examId: previousExamId, classId } }),
    prisma.student.findMany({ where: { classId, graduated: false }, orderBy: { name: "asc" } })
  ]);

  const currentClassTotalMap = new Map<string, number>();
  for (const s of currentClassScores) {
    if (!s.isAbsent) currentClassTotalMap.set(s.studentId, (currentClassTotalMap.get(s.studentId) ?? 0) + s.score);
  }
  const previousClassTotalMap = new Map<string, number>();
  for (const s of previousClassScores) {
    if (!s.isAbsent) previousClassTotalMap.set(s.studentId, (previousClassTotalMap.get(s.studentId) ?? 0) + s.score);
  }

  const currentClassRankList = [...currentClassTotalMap.entries()].sort((a, b) => b[1] - a[1]);
  const currentClassRankMap = new Map<string, number>();
  currentClassRankList.forEach(([id], index) => currentClassRankMap.set(id, index + 1));

  const previousClassRankList = [...previousClassTotalMap.entries()].sort((a, b) => b[1] - a[1]);
  const previousClassRankMap = new Map<string, number>();
  previousClassRankList.forEach(([id], index) => previousClassRankMap.set(id, index + 1));

  const currentGradeRankMap = new Map<string, number>();
  for (const s of currentClassScores) {
    if (s.gradeRank !== null && !currentGradeRankMap.has(s.studentId)) {
      currentGradeRankMap.set(s.studentId, s.gradeRank);
    }
  }
  const previousGradeRankMap = new Map<string, number>();
  for (const s of previousClassScores) {
    if (s.gradeRank !== null && !previousGradeRankMap.has(s.studentId)) {
      previousGradeRankMap.set(s.studentId, s.gradeRank);
    }
  }

  const rows: WukeComparisonData["rows"] = studentsInClass.map((student) => {
    const subjects = {} as WukeComparisonData["rows"][number]["subjects"];
    let currentTotal = 0;
    let hasCurrent = false;
    let previousTotal = 0;
    let hasPrevious = false;
    for (const subject of SUBJECT_ORDER) {
      const curr = currentClassScores.find((s) => s.studentId === student.id && s.subject === subject);
      const prev = previousClassScores.find((s) => s.studentId === student.id && s.subject === subject);
      const current = curr && !curr.isAbsent ? curr.score : null;
      const currentAbsent = curr?.isAbsent ?? false;
      const previous = prev && !prev.isAbsent ? prev.score : null;
      const previousAbsent = prev?.isAbsent ?? false;
      const delta = current !== null && previous !== null ? toFixed(current - previous) : null;
      subjects[subject] = { current, currentAbsent, previous, previousAbsent, delta };
      if (current !== null) { currentTotal += current; hasCurrent = true; }
      if (previous !== null) { previousTotal += previous; hasPrevious = true; }
    }
    const currentClassRank = currentClassRankMap.get(student.id) ?? null;
    const previousClassRank = previousClassRankMap.get(student.id) ?? null;
    const currentGradeRank = currentGradeRankMap.get(student.id) ?? null;
    const previousGradeRank = previousGradeRankMap.get(student.id) ?? null;
    return {
      studentId: student.id,
      studentName: student.name,
      subjects,
      currentTotal: hasCurrent ? currentTotal : null,
      previousTotal: hasPrevious ? previousTotal : null,
      currentClassRank,
      previousClassRank,
      classRankDelta: null,
      currentGradeRank,
      previousGradeRank,
      gradeRankDelta: null
    };
  });

  rows.forEach((row) => {
    if (row.currentClassRank !== null && row.previousClassRank !== null) {
      row.classRankDelta = row.previousClassRank - row.currentClassRank;
    }
    if (row.currentGradeRank !== null && row.previousGradeRank !== null) {
      row.gradeRankDelta = row.previousGradeRank - row.currentGradeRank;
    }
  });

  return {
    currentExamId: currentExam.id,
    currentExamName: currentExam.name,
    previousExamId: previousExam.id,
    previousExamName: previousExam.name,
    rows
  };
}

export async function getWukeWarnings(examId: string, classId: string): Promise<WukeWarningRow[]> {
  noStore();
  const report = await getWukeScoreReport(examId, classId);
  if (!report) return [];

  const warningRows = report.students.filter((row) => row.warnings.length > 0);
  return warningRows.map((row) => {
    const previousClassRank = row.classRankDelta !== null && row.classRankDelta !== undefined
      ? row.classRank + row.classRankDelta
      : null;
    return {
      studentId: row.studentId,
      studentName: row.studentName,
      className: row.className,
      classColor: row.classColor,
      totalScore: row.totalScore ?? 0,
      classRank: row.classRank,
      previousClassRank,
      classRankDelta: row.classRankDelta,
      warnings: row.warnings
    };
  });
}

export async function getWukePageData(examId?: string): Promise<WukePageData> {
  noStore();
  const homeroom = await getHomeroomClass();
  const exams = await getWukeExams();

  if (!homeroom || exams.length === 0) {
    return {
      homeroomClassId: homeroom?.id ?? null,
      homeroomClassName: homeroom?.name ?? null,
      homeroomClassColor: homeroom?.color ?? null,
      exams,
      report: null,
      comparison: null,
      warnings: []
    };
  }

  const selectedExamId = examId && exams.some((e) => e.id === examId) ? examId : exams[exams.length - 1].id;
  const report = await getWukeScoreReport(selectedExamId, homeroom.id);
  const warnings = await getWukeWarnings(selectedExamId, homeroom.id);

  let comparison: WukeComparisonData | null = null;
  if (report && report.previousExamId) {
    comparison = await getWukeComparison(selectedExamId, report.previousExamId, homeroom.id);
  }

  return {
    homeroomClassId: homeroom.id,
    homeroomClassName: homeroom.name,
    homeroomClassColor: homeroom.color,
    exams,
    report,
    comparison,
    warnings
  };
}

export async function getWukeStudentHistory(studentId: string): Promise<WukeStudentHistory | null> {
  noStore();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true }
  });
  if (!student) return null;

  const exams = await prisma.exam.findMany({
    where: { isMultiSubject: true },
    orderBy: { date: "asc" }
  });

  if (exams.length === 0) {
    return {
      studentId: student.id,
      studentName: student.name,
      className: student.class.name,
      classColor: student.class.color,
      points: [],
      recommendations: []
    };
  }

  const classId = student.classId;

  const allScores = await prisma.score.findMany({
    where: { examId: { in: exams.map((e) => e.id) } },
    include: { student: { select: { id: true, classId: true, name: true } } }
  });

  const scoresByExam = new Map<string, typeof allScores>();
  for (const exam of exams) scoresByExam.set(exam.id, []);
  for (const s of allScores) scoresByExam.get(s.examId)?.push(s);

  const classStudents = new Map<string, string[]>();
  {
    const studentsInClass = await prisma.student.findMany({
      where: { classId, graduated: false },
      select: { id: true, name: true }
    });
    classStudents.set(exams[0].id, studentsInClass.map((s) => s.id));
  }
  const classStudentIds = classStudents.get(exams[0].id) ?? [];

  const points: WukeStudentHistoryPoint[] = exams.map((exam) => {
    const examScores = scoresByExam.get(exam.id) ?? [];
    const subjects = {} as WukeStudentHistoryPoint["subjects"];
    let total = 0;
    let hasAny = false;

    for (const subject of SUBJECT_ORDER) {
      const studentHit = examScores.find((s) => s.studentId === student.id && s.subject === subject);
      const score = studentHit && !studentHit.isAbsent ? studentHit.score : null;
      const isAbsent = studentHit?.isAbsent ?? false;

      const classVals = examScores
        .filter((s) => s.classId === classId && s.subject === subject && !s.isAbsent && classStudentIds.includes(s.studentId))
        .map((s) => s.score);
      const classAverage = avg(classVals);

      subjects[subject] = { score, isAbsent, classAverage };
      if (score !== null) {
        total += score;
        hasAny = true;
      }
    }

    const classTotals = examScores
      .filter((s) => s.classId === classId && !s.isAbsent && classStudentIds.includes(s.studentId))
      .reduce<Map<string, number>>((acc, s) => {
        acc.set(s.studentId, (acc.get(s.studentId) ?? 0) + s.score);
        return acc;
      }, new Map());
    const classTotalValues = [...classTotals.values()];
    const classTotalAverage = avg(classTotalValues);

    const ranked = [...classTotals.entries()].sort((a, b) => b[1] - a[1]);
    const rankIdx = ranked.findIndex(([id]) => id === student.id);
    const classRank = rankIdx >= 0 ? rankIdx + 1 : null;
    const participantCount = classTotalValues.length;

    return {
      examId: exam.id,
      examName: exam.name,
      examDate: exam.date.toISOString().slice(0, 10),
      examType: exam.examType,
      subjects,
      totalScore: hasAny ? toFixed(total) : null,
      classTotalAverage,
      classRank,
      participantCount
    };
  });

  const recMap = new Map<Subject, { gapSum: number; count: number }>();
  for (const subject of SUBJECT_ORDER) recMap.set(subject, { gapSum: 0, count: 0 });
  for (const p of points) {
    for (const subject of SUBJECT_ORDER) {
      const cell = p.subjects[subject];
      if (cell.score !== null) {
        const gap = toFixed(cell.score - cell.classAverage);
        const rec = recMap.get(subject)!;
        rec.gapSum += gap;
        rec.count += 1;
      }
    }
  }
  const recommendations = [...recMap.entries()]
    .map(([subject, v]) => ({
      subject,
      avgGap: v.count > 0 ? toFixed(v.gapSum / v.count) : 0,
      attendedCount: v.count
    }))
    .filter((r) => r.attendedCount > 0)
    .sort((a, b) => a.avgGap - b.avgGap);

  return {
    studentId: student.id,
    studentName: student.name,
    className: student.class.name,
    classColor: student.class.color,
    points,
    recommendations
  };
}
