# EduScore

初三社会单科成绩系统（Next.js 16 + App Router + Prisma + Vercel Prisma Postgres）

## 登录信息

- 用户名：`admin`
- 密码：`201227`

## 一、首次接入 Vercel Prisma Postgres

数据库实例：
- Name: `prisma-postgres-gray-canvas`
- Prisma ID: `cmmgglsth05pe2qee1ifyuc4j`

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 Vercel CLI（你当前报错的原因）

你报错 `vercel : 无法将“vercel”项识别为...` 是因为本机没安装 Vercel CLI。

安装方式（任选其一）：

```bash
npm i -g vercel
```

或（无需全局安装）：

```bash
npx vercel --version
```

### 3. 连接 Vercel 项目

```bash
vercel link
```

执行后会让你选择 Team / Project，选中你的 `EduScore` 对应项目。

### 4. 拉取环境变量

```bash
vercel env pull .env.development.local
```

需要包含：
- `DATABASE_URL`
- `POSTGRES_URL`
- `PRISMA_DATABASE_URL`
- `AUTH_SECRET`

### 5. 生成 Prisma Client + 迁移 + 种子数据

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

### 6. 本地运行

```bash
npm run dev
```

## 二、部署到 Vercel

预览部署：

```bash
vercel deploy
```

生产部署：

```bash
vercel --prod
```

## 三、后续更新流程

### 1. 拉取最新环境变量

```bash
vercel env pull .env.development.local
```

### 2. 如果改了 Prisma 模型

```bash
npm run prisma:migrate -- --name <migration_name>
npm run prisma:generate
```

如需重置演示数据：

```bash
npm run prisma:seed
```

### 3. 发布

```bash
vercel --prod
```

## 四、GitHub 更新流程

```bash
git add .
git commit -m "feat: update auth and postgres migration"
git push origin main
```

## 五、系统规则（当前）

- 单科系统（社会）
- 导入时读取第一行表头
- 成绩列优先识别“社会”列，找不到再回退到“成绩/分数/总分/得分”
- 按姓名自动匹配考生，不存在则自动创建并写入成绩
- 仅登录后可访问仪表盘等业务页面（Proxy + JWT）
