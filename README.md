# EduScore

初三社会单科成绩系统（Next.js 16 + App Router + Prisma + Vercel Postgres）。

## 登录

- 用户名：`admin`
- 密码：`201227`
 
## 第一步：本地启动（下面npm三行在 终端 复制进去）

```bash
npm install
npm run prisma:generate
npm run dev
```

打开 `http://localhost:3000`。

## 第二步： 小白也能用的 Vibecode 流程（VSCode + Codex 插件）

1. 用 VSCode 打开项目文件夹。（在左边）
2. 打开 VSCode 的 Codex 插件，在对话里直接说需求（例如：`新增班级删除确认弹窗`）。（在右边，聊天旁边）
3. 改完后刷新确认新功能(所有东西改完再第三步)

建议一次只改一个小目标，定位问题更快。

## 第三步： 不用命令行的提交与推送（VSCode 可视化 Git）

1. 左侧点击 `源代码管理`（Git 图标）。（最左侧第三个）
2. 在变更列表里点 `+` 暂存所有文件。（鼠标移上去会浮现出来）
3. 点击上方输入右边的星号图表，ai自动添加提交说明。）（上方消息栏最右边）
4. 点击 `提交`。
5. 点击 `同步更改` 或 `推送`。

推送到 GitHub 后，Vercel 会自动部署。

## 4. 查看部署状态（Vercel）

项目面板：`https://vercel.com/muwentaotao-3037s-projects/edu-score`

进入后看 `Deployments`，状态是 `Ready` 就代表线上已更新。

## 5. 数据库变更（仅在改 Prisma 模型时）

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

如果只是改前端页面，不需要跑迁移。
