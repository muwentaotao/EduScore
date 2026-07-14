import * as XLSX from "xlsx";

export type ScoreRecord = {
  name: string;
  score: number;
  isAbsent: boolean;
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
    const isAbsent = !rawScore || Number.isNaN(score) || score === 0;
    records.push({ name, score: isAbsent ? 0 : score, isAbsent });
  }

  return records;
}
