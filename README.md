# EduScore

初三社会学科成绩分析系统（Next.js 16 + App Router + Prisma + SQLite）。

## 1. 启动

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

## 2. 说明

- `prisma:seed` 仅初始化必要基础数据：3 个班级（不生成学生假数据）。
- `/class/manage`：班级管理页。
  - 新增班级（可自定义班级名称与卡片颜色）。
  - 按班级导入学生名单（A 列学号，B 列姓名）。
- `/class/[classId]`：班级成绩页。
  - 导入成绩（B 列姓名，D 列成绩）。
  - 匹配优先级：学号 -> 姓名精确 -> 姓名模糊。
- `/analysis`：年级分析页。
  - 考试筛选、班均分图、分布图、总排名。
  - 进步 TOP5 / 退步 TOP5。
  - 每次考试进步最大的五名（相对上一次考试）。

## 3. 导出

- `/api/export?examId=<考试ID>`
