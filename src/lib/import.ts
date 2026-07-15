import * as XLSX from "xlsx";
import type { Subject } from "@prisma/client";
import { SUBJECT_KEYWORDS, SUBJECT_ORDER } from "@/lib/subject";

export type ScoreRecord = {
  name: string;
  score: number;
  isAbsent: boolean;
};

export type WukeScoreRecord = {
  className: string;
  name: string;
  gradeRank: number | null;
  scores: Partial<Record<Subject, { score: number; isAbsent: boolean }>>;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function parseRows(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Array<string | number | null>>(sheet, { header: 1, raw: false });
}

function findColumnIndex(headers: string[], keywords: string[]) {
  const normalized = headers.map((h) => normalizeText(h ?? ""));
  const index = normalized.findIndex((header) =>
    keywords.some((k) => (header ?? "").includes(normalizeText(k)))
  );
  return index >= 0 ? index : null;
}

function isNumericValue(value: string) {
  if (!value) return false;
  const num = Number(value);
  return !Number.isNaN(num);
}

function detectNameColumnByContent(
  rows: Array<Array<string | number | null>>,
  maxCol: number,
  skipCol: number
): number | null {
  let bestCol: number | null = null;
  let bestRatio = 0;
  for (let col = 0; col < maxCol; col += 1) {
    if (col === skipCol) continue;
    let textCount = 0;
    let totalCount = 0;
    for (let i = 1; i < rows.length; i += 1) {
      const cell = rows[i]?.[col];
      const str = String(cell ?? "").trim();
      if (!str) continue;
      totalCount += 1;
      if (!isNumericValue(str)) {
        textCount += 1;
      }
    }
    if (totalCount > 0) {
      const ratio = textCount / totalCount;
      if (ratio > bestRatio && ratio > 0.6) {
        bestRatio = ratio;
        bestCol = col;
      }
    }
  }
  return bestCol;
}

function detectScoreColumnByContent(
  rows: Array<Array<string | number | null>>,
  maxCol: number,
  skipCol: number
): number | null {
  let bestCol: number | null = null;
  let bestRatio = 0;
  for (let col = 0; col < maxCol; col += 1) {
    if (col === skipCol) continue;
    let numCount = 0;
    let totalCount = 0;
    for (let i = 1; i < rows.length; i += 1) {
      const cell = rows[i]?.[col];
      const str = String(cell ?? "").trim();
      if (!str) continue;
      totalCount += 1;
      if (isNumericValue(str)) {
        numCount += 1;
      }
    }
    if (totalCount > 0) {
      const ratio = numCount / totalCount;
      if (ratio > bestRatio && ratio > 0.6) {
        bestRatio = ratio;
        bestCol = col;
      }
    }
  }
  return bestCol;
}

export function parseFileToRecords(buffer: ArrayBuffer): ScoreRecord[] {
  const rows = parseRows(buffer);
  const headers = (rows[0] ?? []).map((cell) => String(cell ?? "").trim());

  const nameIndex = findColumnIndex(headers, ["姓名", "名字", "学生", "name", "student"]);
  const socialIndex = findColumnIndex(headers, ["社会", "道法", "政史", "政治"]);
  const fallbackScoreIndex = findColumnIndex(headers, ["成绩", "分数", "总分", "得分", "score", "grade", "mark"]);
  const scoreIndex = socialIndex ?? fallbackScoreIndex;

  const maxNameCol = Math.min(3, headers.length);
  const maxScoreCol = Math.min(5, headers.length);

  let finalNameIndex = nameIndex;
  let finalScoreIndex = scoreIndex;

  if (finalNameIndex === null) {
    finalNameIndex = detectNameColumnByContent(rows, maxNameCol, -1);
  }

  if (finalScoreIndex === null) {
    finalScoreIndex = detectScoreColumnByContent(rows, maxScoreCol, finalNameIndex ?? -1);
  }

  if (finalNameIndex === null || finalScoreIndex === null) {
    return [];
  }

  const records: ScoreRecord[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const name = String(row[finalNameIndex] ?? "").trim();
    const rawScore = String(row[finalScoreIndex] ?? "").trim();
    if (!name) {
      continue;
    }

    const score = Number(rawScore);
    const isAbsent = !rawScore || Number.isNaN(score) || score === 0 || /缺考/.test(rawScore);
    records.push({ name, score: isAbsent ? 0 : score, isAbsent });
  }

  return records;
}

function parseScoreCell(raw: string): { score: number; isAbsent: boolean } {
  const trimmed = raw.trim();
  if (!trimmed || /缺考/.test(trimmed)) {
    return { score: 0, isAbsent: true };
  }
  const num = Number(trimmed);
  if (Number.isNaN(num) || num === 0) {
    return { score: 0, isAbsent: true };
  }
  return { score: num, isAbsent: false };
}

function detectSubjectColumns(headers: string[]): Partial<Record<Subject, number>> {
  const result: Partial<Record<Subject, number>> = {};
  const normalized = headers.map((h) => normalizeText(h ?? ""));
  for (const subject of SUBJECT_ORDER) {
    const keywords = SUBJECT_KEYWORDS[subject];
    const index = normalized.findIndex((header) =>
      keywords.some((k) => (header ?? "").includes(normalizeText(k)))
    );
    if (index >= 0) result[subject] = index;
  }
  return result;
}

function detectClassColumn(headers: string[]): number | null {
  const normalized = headers.map((h) => normalizeText(h ?? ""));
  const index = normalized.findIndex((header) =>
    ["班级", "班", "class"].some((k) => (header ?? "").includes(normalizeText(k)))
  );
  return index >= 0 ? index : null;
}

function detectGradeRankColumn(headers: string[]): number | null {
  const normalized = headers.map((h) => normalizeText(h ?? ""));
  const index = normalized.findIndex((header) =>
    ["年级排名", "年排", "年级名次", "graderank", "grade_rank"].some((k) =>
      (header ?? "").includes(normalizeText(k))
    )
  );
  return index >= 0 ? index : null;
}

export function parseWukeFileToRecords(buffer: ArrayBuffer): WukeScoreRecord[] {
  const rows = parseRows(buffer);
  const headers = (rows[0] ?? []).map((cell) => String(cell ?? "").trim());

  const classIndex = detectClassColumn(headers);
  const nameIndex = findColumnIndex(headers, ["姓名", "名字", "学生", "name", "student"]);
  const subjectColumns = detectSubjectColumns(headers);
  const gradeRankIndex = detectGradeRankColumn(headers);

  const finalNameIndex = nameIndex ?? (classIndex !== null && classIndex === 0 ? 1 : 0);

  const records: WukeScoreRecord[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const name = String(row[finalNameIndex] ?? "").trim();
    if (!name) continue;
    const className = classIndex !== null ? String(row[classIndex] ?? "").trim() : "";

    let gradeRank: number | null = null;
    if (gradeRankIndex !== null) {
      const rawRank = String(row[gradeRankIndex] ?? "").trim();
      const parsed = Number(rawRank);
      if (rawRank && !Number.isNaN(parsed) && Number.isInteger(parsed)) {
        gradeRank = parsed;
      }
    }

    const scores: WukeScoreRecord["scores"] = {};
    for (const subject of SUBJECT_ORDER) {
      const col = subjectColumns[subject];
      if (col === undefined) continue;
      const raw = String(row[col] ?? "").trim();
      scores[subject] = parseScoreCell(raw);
    }

    records.push({ className, name, gradeRank, scores });
  }

  return records;
}
