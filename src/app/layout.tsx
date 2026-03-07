import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { AppShell } from "@/components/layout/shell";

export const metadata: Metadata = {
  title: "EduScore",
  description: "初三社会成绩管理系统"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
