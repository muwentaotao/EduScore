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
  const normalized = headers.map((h) => normalizeText(h));
  const index = normalized.findIndex((header) => keywords.some((k) => header.includes(normalizeText(k))));
  return index >= 0 ? index : null;
}

export function parseFileToRecords(buffer: ArrayBuffer): ScoreRecord[] {
  const rows = parseRows(buffer);
  const headers = (rows[0] ?? []).map((cell) => String(cell ?? "").trim());

  const nameIndex = findColumnIndex(headers, ["姓名", "名字", "学生"]);
  const socialIndex = findColumnIndex(headers, ["社会", "道法", "政史", "政治"]);
  const fallbackScoreIndex = findColumnIndex(headers, ["成绩", "分数", "总分", "得分"]);
  const scoreIndex = socialIndex ?? fallbackScoreIndex;

  if (nameIndex === null || scoreIndex === null) {
    return [];
  }

  const records: ScoreRecord[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const name = String(row[nameIndex] ?? "").trim();
    const rawScore = String(row[scoreIndex] ?? "").trim();
    if (!name) {
      continue;
    }

    const score = Number(rawScore);
    const isAbsent = !rawScore || Number.isNaN(score) || score === 0;
    records.push({ name, score: isAbsent ? 0 : score, isAbsent });
  }

  return records;
}
