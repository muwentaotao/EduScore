# Copilot Instructions for EduScore

You are working on EduScore. Follow these rules strictly.

## Required Stack
- Next.js 16
- App Router only (no Pages Router)
- shadcn/ui + Tailwind CSS
- Prisma + Vercel Postgres

## Domain Rules
- Single-subject system for junior high Social Studies.
- Core entities: Class, Student, Exam, Score.
- Import flow: match student by name; create student if not exists; then write score for selected exam.
- Trend/progress features are student-centered.

## Routing and Auth
- Pages: `src/app/**/page.tsx`
- APIs: `src/app/api/**/route.ts`
- Use Next.js 16 `proxy.ts` with JWT cookie auth.
- Unauthenticated page access -> redirect to `/login`.
- Unauthenticated protected API -> return `401`.

## Next.js 缓存规则（重点）
- 涉及“新增/删除/导入后要立即看到结果”的页面或接口，默认按“禁缓存”实现。
- 服务端数据函数（如 `src/lib/data.ts`）使用 `noStore()`。
- 需要实时数据的页面导出：`export const dynamic = "force-dynamic"`。
- 需要实时数据的 GET Route Handler 设置：
  - `export const dynamic = "force-dynamic"`
  - 返回头：`Cache-Control: no-store`
- 客户端 `fetch` 实时数据时显式传：`{ cache: "no-store" }`。
- 如果使用 Server Action 或写操作后返回服务端页面，需补 `revalidatePath()`（或等价失效策略）。
- 在 Vercel 环境优先验证“写入成功后页面是否立即更新”，避免只在本地通过。

## Coding Rules
- Use strict TypeScript types, avoid `any`.
- Reuse existing modules/components first.
- Prefer shadcn/ui components over custom base UI.
- Make minimal, requirement-scoped changes only.
- Do not introduce new frameworks/libraries unless explicitly requested.

## Prisma Rules
- Any schema change must include migration.
- All DB reads/writes go through Prisma Client.
- Do not add mock/demo data unless explicitly asked.

## Output Rules
- State result first, then changed files.
- Mention whether `lint / build / migrate` were run.
- List risks separately if any.

## Pre-commit Checklist
- Next.js 16 + App Router kept
- shadcn/ui conventions kept
- Prisma + Vercel Postgres works
- proxy + JWT interception works
- Mobile layout works
- `npm run lint` has no errors
- No out-of-scope changes
