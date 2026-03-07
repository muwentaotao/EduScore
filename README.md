# EduScore

初三社会单科成绩系统（Next.js 16 + App Router + Prisma + Vercel Prisma Postgres）。

## 登录信息

- 用户名：`admin`
- 密码：`201227`

## 1. 迁移到 Vercel Prisma Postgres（首次）

已配置数据库实例：
- Name: `prisma-postgres-gray-canvas`
- Prisma ID: `cmmgglsth05pe2qee1ifyuc4j`

### 1.1 安装依赖

```bash
npm install
```

### 1.2 连接 Vercel 项目

```bash
vercel link
```

### 1.3 拉取数据库环境变量

```bash
vercel env pull .env.development.local
```

你需要确保本地环境中有这些变量（由 Vercel 拉取）：
- `DATABASE_URL`
- `POSTGRES_URL`
- `PRISMA_DATABASE_URL`

### 1.4 生成 Prisma Client

```bash
npm run prisma:generate
```

### 1.5 创建迁移并应用到 Prisma Postgres

```bash
npm run prisma:migrate -- --name init
```

### 1.6 初始化基础数据

```bash
npm run prisma:seed
```

### 1.7 本地启动

```bash
npm run dev
```

## 2. 部署流程（Vercel）

```bash
vercel deploy
```

生产发布：

```bash
vercel --prod
```

## 3. 后续更新流程（每次发版）

### 3.1 拉取最新环境变量（建议先做）

```bash
vercel env pull .env.development.local
```

### 3.2 修改 `prisma/schema.prisma` 后

1. 创建迁移并应用：

```bash
npm run prisma:migrate -- --name <migration_name>
```

2. 生成客户端：

```bash
npm run prisma:generate
```

3. 如需补基础数据：

```bash
npm run prisma:seed
```

### 3.3 发布

```bash
vercel --prod
```

## 4. 当前系统行为

- 单科目系统（社会科）
- 导入成绩时自动识别首行表头
- 成绩列优先识别“社会”列，找不到再回退“成绩/分数/总分/得分”
- 同名考生自动匹配；不存在则自动创建后写入该次考试成绩
- 可删除考试（删除考试及其全部成绩）
- 仪表盘和趋势表最多展示最近 5 场考试
