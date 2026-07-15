import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = ["班级", "姓名", "语文", "数学", "英语", "科学", "社会", "年级排名"];
  const exampleRows = [
    ["904", "张三", 85, 92, 78, 88, 90, 15],
    ["904", "李四", 72, 65, 80, 70, 85, 45],
    ["904", "王五", 90, 88, 95, 82, 78, 8]
  ];
  const data = [headers, ...exampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "五科成绩");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="wuke-template.xlsx"'
    }
  });
}
