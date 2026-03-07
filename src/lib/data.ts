import { prisma } from "@/lib/prisma";
import type { AnalysisPageData, ClassDetail, DashboardStudentRow, ScoreMap } from "@/lib/types";
import { toFixed } from "@/lib/utils";

function avg(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return toFixed(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export async function getDashboardData() {
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
      scores[exam.id] = hit ? hit.score : null;
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
      studentNo: student.studentNo,
      studentName: student.name,
      scores,
      progressDelta,
      rankMetric: progressDelta ?? -9999,
      rank: 0
    };
  });

  rows
    .sort((a, b) => b.rankMetric - a.rankMetric)
    .forEach((row, index) => {
      row.rank = index + 1;
    });

  return {
    classes: classes.map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      studentCount: rows.filter((row) => row.classId === item.id).length
    })),
    exams: exams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      date: exam.date.toISOString().slice(0, 10)
    })),
    rows: rows.map(({ rankMetric, ...row }) => row)
  };
}

export async function getClassDetail(classId: string): Promise<ClassDetail | null> {
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
      .map((student) => student.scores.find((score) => score.examId === exam.id)?.score ?? null)
      .filter((item): item is number => item !== null);
    return {
      examId: exam.id,
      examName: exam.name,
      average: avg(values)
    };
  });

  const students = classInfo.students.map((student) => {
    const scores: ScoreMap = {};
    for (const exam of exams) {
      const found = student.scores.find((score) => score.examId === exam.id);
      scores[exam.id] = found?.score ?? null;
    }
    return {
      studentId: student.id,
      studentNo: student.studentNo,
      studentName: student.name,
      scores
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
    where: { examId: selected.id },
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
      average: avg(classScores)
    };
  });

  const distributionBuckets = [
    { key: "90-100", min: 90, max: 100 },
    { key: "80-89", min: 80, max: 89.99 },
    { key: "70-79", min: 70, max: 79.99 },
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
      where: { examId: prevExam.id },
      include: {
        student: {
          include: {
            class: true
          }
        }
      }
    });
    const prevMap = new Map(prevScores.map((item) => [item.studentId, item.score]));
    const deltaRows = scores
      .filter((item) => prevMap.has(item.studentId))
      .map((item) => {
        const previous = prevMap.get(item.studentId) ?? item.score;
        return {
          studentId: item.studentId,
          studentName: item.student.name,
          className: item.student.class.name,
          current: item.score,
          previous,
          delta: toFixed(item.score - previous)
        };
      });

    improveTop5 = [...deltaRows].sort((a, b) => b.delta - a.delta).slice(0, 5);
    declineTop5 = [...deltaRows].sort((a, b) => a.delta - b.delta).slice(0, 5);
  }

  if (exams.length > 1) {
    const scoreRows = await prisma.score.findMany({
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
        const rows = [...currentMap.values()]
          .filter((current) => previousMap.has(current.studentId))
          .map((current) => {
            const previous = previousMap.get(current.studentId)!;
            return {
              studentId: current.studentId,
              studentName: current.student.name,
              className: current.student.class.name,
              classColor: current.student.class.color,
              previous: previous.score,
              current: current.score,
              delta: toFixed(current.score - previous.score)
            };
          })
          .sort((a, b) => b.delta - a.delta)
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
    examProgressTop5
  };
}
