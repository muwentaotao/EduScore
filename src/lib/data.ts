import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import type {
  AnalysisPageData,
  ClassComparisonData,
  ClassDetail,
  DashboardData,
  DashboardStudentRow,
  ScoreMap,
  StudentDetail,
  StudentListItem
} from "@/lib/types";
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
    prisma.exam.findMany({ orderBy: { date: "asc" } }),
    prisma.student.findMany({
      include: {
        class: true,
        scores: {
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
        include: {
          scores: {
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

  const exams = await prisma.exam.findMany({ orderBy: { date: "asc" } });
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
    prisma.exam.findMany({ orderBy: { date: "asc" } }),
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
      examProgressTop5: []
    };
  }

  const scores = await prisma.score.findMany({
    where: { examId: selected.id, isAbsent: false },
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
      where: { examId: prevExam.id, isAbsent: false },
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
      where: { isAbsent: false },
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
    classComparison: await getClassComparisonData(exams)
  };
}

export async function getStudentList(): Promise<StudentListItem[]> {
  noStore();
  const students = await prisma.student.findMany({
    include: {
      class: true,
      scores: { include: { exam: true } }
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
      scores: { include: { exam: true } }
    }
  });

  if (!student) return null;

  const exams = await prisma.exam.findMany({ orderBy: { date: "asc" } });

  const allScores = await prisma.score.findMany({
    where: { isAbsent: false },
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
    where: { isAbsent: false },
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
