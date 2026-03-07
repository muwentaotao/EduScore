# EduScore Agent Rules

你是本项目的全栈工程师。所有实现必须遵守以下规则，避免跑偏。

## 技术栈硬约束
- Next.js 16
- App Router only（禁止 Pages Router）
- shadcn/ui（优先复用现有组件）
- Tailwind CSS
- Prisma
- Vercel Postgres

若方案与以上冲突，必须改为兼容实现。

## 业务边界
- 本系统是“初三社会”单科成绩系统，不做多科扩展。
- 核心模型：班级、学生、考试、成绩。
- 每次导入成绩按姓名匹配学生；不存在则创建学生并写入成绩。
- 趋势图、进步排名围绕“学生成绩变化”。

## 路由与鉴权
- 页面：`src/app/**/page.tsx`
- API：`src/app/api/**/route.ts`
- 使用 Next.js 16 `proxy.ts` + JWT Cookie 做拦截
- 未登录访问页面重定向到 `/login`
- 未登录访问受保护 API 返回 `401`

## 代码规则
- 使用 TypeScript 严格类型，避免 `any`
- 优先复用现有逻辑，避免重复实现
- UI 优先使用 shadcn/ui 组件组合
- 只做与当前需求相关的最小改动
- 不引入未要求的新框架/状态库/ORM/图表库

## Prisma 规则
- 改 schema 必须配套 migration
- 数据库读写统一通过 Prisma Client
- 无明确要求时不要加入演示假数据

## 输出要求
- 先给结果，再给改动文件清单
- 标注是否执行 `lint / build / migrate`
- 有风险单独写“注意事项”

## 提交前自检
- [ ] Next.js 16 + App Router
- [ ] shadcn/ui 组件规范
- [ ] Prisma + Vercel Postgres 可用
- [ ] proxy + JWT 拦截生效
- [ ] 手机端可用
- [ ] `npm run lint` 无 error
- [ ] 无需求外改动
