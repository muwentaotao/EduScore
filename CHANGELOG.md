# 改动记录

每次改动后，通过 `http://localhost:3000` 本地查看效果。

---

## [2026-09-13] 数据可视化增强（进步/退步双 Tab、名次变化列、分数段细化）

### 新增
- **仪表盘「退步预警」页签**：原「当前学生进步榜」卡片改为双 Tab——「进步榜 / 退步预警（人数）」。退步预警按最近两场考试分数差升序列出下降学生，无退步时显示空态；新增客户端组件 `src/components/dashboard/progress-board.tsx`（`ProgressCell`、`RankBadge` 随之迁入）
- **年级分析「名次变化」列接通**：总排名表新增显示对比上次考试的名次升降（↑绿/↓红/持平），此前该列恒为「-」（`RankChangeBadge` 从未收到 `previousRank` 的死代码问题，属既有 P1）
- **班级详情分数段分布细化**：4 段（90+/70-89/60-69/<60）细化为 5 段（90-100/80-89/70-79/60-69/<60），柱顶直接标注人数（`LabelList`）

### 改动
- `src/lib/data.ts`：`getAnalysisData` 把上次考试名次（`previousRankMap`）挂到总排名 `rankings` 每行（`previousRank: number | null`）；类型同步更新（`src/lib/types.ts`）
- `src/components/analysis/analysis-client.tsx`：删除从未生效的 `previousRankMap` 占位死代码
- `src/app/page.tsx`：排名表格整段迁出至 `ProgressBoard`，页面更精简

### 核实无需改动（已存在）
- 学生详情「个人成绩 + 班级均分」双线对比图：已存在（面积图 + 虚线对照）
- 年级分析分数段分布图：已存在
- 仪表盘 KPI 迷你趋势线：第一轮已完成

### 验证
- `next build`：通过

### 注意事项
- 「名次变化」在所选考试为第一场时无上次考试，全部显示「-」，属预期
- 一星项（班级五维雷达图）按用户要求不做

---

## [2026-09-13] 动效增强（7 项，纯 CSS/配置，无新依赖）

### 新增
- **KPI 数字滚动**：仪表盘「当前班级 / 学生总数 / 考试场次」数字从 0 滚动到目标值（新增 `src/components/ui/count-up.tsx`，requestAnimationFrame + cubic 缓出，约 700ms）
- **班级卡片进度条生长**：仪表盘班级卡的均分进度条首次渲染从 0 生长到目标宽度（`.bar-grow`，scaleX 动画，不改变布局）
- **进步榜行依次入场**：每行延迟 30ms 滑入（复用既有 `stagger-section` + 行内 `animationDelay`，封顶 12 行）
- **内联改分保存反馈**：保存成功后该单元格弹跳（复用既有 `score-pop`）并短暂显示浅绿高亮，1.2 秒后消退（`flashCell` + `flashTimeoutRef`）
- **侧边栏文字淡入**：折叠→展开时，导航/品牌/搜索/用户区文字 `animate-fadeIn` 淡入（原来瞬间出现）

### 改动
- **卡片 hover 微浮起**：`Card` 组件 hover 时 `translateY(-2px)` + 阴影加深（原来只有阴影变化）
- **趋势图绘制动画**：仪表盘面积图显式 `animationDuration={800}` + `ease-out` 缓动
- 补删上一轮遗留的 7 处 `font-mono`（班级详情 2 处、学生详情 5 处；有两处编辑工具误报成功实际未写入，已复核修净）

### 改动文件
- 新增：`src/components/ui/count-up.tsx`
- `src/app/globals.css`（`bar-grow` keyframes）、`src/app/page.tsx`
- `src/components/ui/card.tsx`、`src/components/dashboard/dashboard-trend-chart.tsx`
- `src/components/class/class-detail-client.tsx`（flashCell 反馈 + font-mono 补删）
- `src/components/students/student-detail-client.tsx`（font-mono 补删）
- `src/components/layout/shell.tsx`

### 验证
- `next build`：通过（BUILD_EXIT=0，TypeScript 检查过，7/7 静态页生成）

### 注意事项
- 纯动效改动，无新依赖、未动接口/数据库/业务逻辑
- 数据可视化增强（分数段直方图、双线对比等）按用户要求本轮**不做**

---

## [2026-09-13] 界面美观优化（圆角/留白/KPI 卡/趋势图/骨架屏等）

### 改动
- **全局圆角**：`--radius` 0.375rem → 0.625rem；`Card` 组件由硬编码 `rounded-[4px]` 改为 `rounded-lg`（跟随全局变量）
- **留白**：主内容区 padding `p-4 md:p-6` → `p-4 md:p-8 lg:p-10`；仪表盘卡片间距 `gap-4` → `gap-5`、区块间距 `space-y-6` → `space-y-8`
- **仪表盘头部**：移除右上「班级管理 / 学生管理」两个按钮（侧边栏已有入口）
- **仪表盘 KPI 卡**：去掉四色图标贴片，改为「大数字」风格；「进步之星」卡右侧新增该生的迷你成绩趋势线（启用原无人引用的 `Sparkline` 组件）
- **仪表盘趋势图**：折线图改为面积图（班级色 8% 浅填充），新增图例（可点击显隐班级）；缺考班级数据由 `0` 改为 `null`，曲线显示为断点而非砸底（顺带修复仪表盘侧「0 分陷阱」）
- **登录页**：背景加极淡的主色径向渐变；卡片圆角加大、阴影升级；修复不存在的 `shadow-soft` 类
- **加载态**：年级分析、班级详情、学生管理、学生详情、班级管理、成绩导入 6 处的「转圈 + 加载中」改为骨架屏（新增 `src/components/ui/skeleton.tsx`）；按钮内的小转圈保持不变
- **表格**：单元格行高 `p-2` → `px-2 py-2.5`；全站成绩/名次数字去掉 `font-mono`（全局已有 tabular-nums，风格统一）

### 改动文件
- `src/app/globals.css`、`src/app/page.tsx`、`src/app/login/page.tsx`
- `src/components/ui/card.tsx`、`src/components/ui/table.tsx`、`src/components/ui/skeleton.tsx`（新增）
- `src/components/layout/shell.tsx`
- `src/components/dashboard/dashboard-trend-chart.tsx`
- `src/components/analysis/analysis-client.tsx`、`src/components/class/class-detail-client.tsx`、`src/components/class/class-manage-client.tsx`、`src/components/students/student-manage-client.tsx`、`src/components/students/student-detail-client.tsx`、`src/components/import/score-import-client.tsx`

### 未改
- 色彩体系（雾霾蓝主色）保持不变，仅修圆角/留白/组件层次
- 图表网格线：核实全项目已统一为 `#e2e8f0`，无需改动

### 验证
- `eslint src`：无 error
- `next build`：通过

### 注意事项
- 纯样式与展示层改动，未动接口、数据库与业务逻辑
- 「0 分陷阱」本次只修仪表盘链路（`page.tsx` 传 null）；`lib/data.ts` 的 `avg([])` 返回 0 在班级趋势等其他链路仍存在，属既有 P1 问题，未在本次范围内

---

## [2026-09-13] 班级详情页支持内联改分

### 新增
- 「学生成绩表」中每个成绩单元格可直接点击修改，用于导入后发现个别学生批改有误需要更正
  - 点击单元格就地变输入框，输入后**回车保存**、**Esc 或点击别处取消**
  - 保存前二次确认，明确显示「由 X 分改为 Y 分」
  - 客户端校验：必须为数字且落在 0–100 之间
  - 保存成功后静默刷新页面数据（不整页闪「加载中」），均分/分数段/趋势等指标同步更新
  - 失败时在表格上方显示原因（如毕业归档学生返回只读提示）
- 毕业归档页面为只读，单元格不进入编辑态

### 接口
- 复用现有 `POST /api/score`（按「学生 + 考试 + 社会科」upsert），未新增接口、未改数据库

### 改动文件
- `src/components/class/class-detail-client.tsx`（唯一改动文件）

### 验证
- `next build`：Compiled successfully，TypeScript 检查通过，7/7 静态页生成

### 注意事项
- 未做写入实测：本地 dev 直连生产库，改分会产生真实数据变更，故仅做静态验证
- 未支持内联切换「缺考」标记，仍需在「学生管理 → 学生详情」中操作

---

## [2026-09-12] 清理五科遗留

### 删除文件
- `scripts/inspect.ts`、`scripts/check-students.ts`、`scripts/remove-bad-students.ts`（五科数据排查用的一次性脚本，引用了 `isHomeroom`，`package.json` 与源码均无引用）
- `scripts/` 目录随之删除

### 重命名
- `src/lib/subject.ts` → `src/lib/exam-type.ts`：该文件现在只剩 `EXAM_TYPE_ORDER` 与 `EXAM_TYPE_LABELS`，原名已名不副实
- 同步修改 2 处 import：`src/app/api/class/[classId]/import/route.ts`、`src/components/class/score-import-form.tsx`
- **导出名保持不变**，未改动常量名

### 验证
- `tsc --noEmit`：0 error
- `next build`：Compiled successfully，路由表无 `/wuke` 与 `/api/wuke/*`
- 数据库结构未改动，未执行 migration

---

## [2026-09-12] 移除五科成绩入口，仅保留社会单科

### 入口调整
- 侧边栏移除「五科成绩」入口；导航由「社会成绩」折叠组改为 6 项平铺（仪表盘/年级分析/班级成绩/成绩导入/班级管理/学生管理）+ 设置
- 班级管理页移除「设为班主任」按钮与「班主任」徽标

### 删除文件
- `src/app/wuke/page.tsx`
- `src/components/wuke/wuke-client.tsx`
- `src/app/api/wuke/route.ts`、`import/route.ts`、`student/route.ts`、`template/route.ts`、`homeroom/route.ts`

### 清理代码
- `src/lib/data.ts` — 7 个 `getWuke*` 函数、`getHomeroomClass`、预警阈值常量、`buildSubjectRankMap`、`computeWarnings`
- `src/lib/types.ts` — 全部 `Wuke*` 类型
- `src/lib/import.ts` — `parseWukeFileToRecords`、`WukeScoreRecord` 及五科表头识别辅助函数（`detectSubjectColumns` 等）
- `src/lib/subject.ts` — `SUBJECT_ORDER/LABELS/COLORS/KEYWORDS`、`EXAM_TYPE_COLORS`、`examTypeLabel`、`subjectLabel`
- `src/components/settings/settings-client.tsx` — 「五科 Excel 模板」下载卡片及 `downloadTemplate`
- `src/app/api/class/route.ts` — 响应中的 `isHomeroom` 字段

### 未改动（数据保留）
- 数据库结构与数据不变，未执行 migration：`Class.isHomeroom`、`Exam.isMultiSubject`、`Score.subject` 原样保留
- 备份/恢复链路仍完整读写这两个字段，历史五科考试与成绩数据未删除
- 社会单科查询继续以 `isMultiSubject: false` 过滤考试

---

## [2026-07-15] 偏科分析对话框可视化增强

### 历次偏科趋势 tab
- 改用 **Small multiples（小多组图）** 布局，每科独立卡片 + 独立折线图
- 2 列 grid 排列，纵轴自适应缩放至该科分数范围
- 顶部显示最高 / 最低分，数据标签清晰

### 与班级均分对比 tab
- **柱状对比图**：最近一次考试，每科两柱（个人 vs 班均），各自科目颜色区分
- **差值趋势折线图**：各科「个人-班均」差值随时间变化，直观展示差距扩大/缩小
- **汇总表**：每科差距带 ↑↓ 图标

### 涉及文件
- `src/components/wuke/wuke-client.tsx` — RadarDialog 重写

---

## [2026-07-15] 考试类型支持 + 导入优化

### 新增 ExamType 枚举
- 类型：月考 / 期中 / 期末 / 周测 / 模拟考
- schema 新增 `Exam.examType` 字段，已执行 migration `add_exam_type`

### 导入流程
- 五科导入 + 社会导入均增加考试类型下拉选择
- API 接收 examType 写入数据库

### 考试类型标签
- 五科页面考试 tab 按钮内显示类型徽标（周测/月考/期中/期末）

### 涉及文件
- `prisma/schema.prisma`
- `src/lib/subject.ts` — 类型映射
- `src/lib/types.ts` — WukeExamItem / WukeStudentHistory 类型
- `src/lib/data.ts` — getWukeStudentHistory()
- `src/app/api/wuke/student/route.ts` — 五科学生历史 API
- `src/app/api/wuke/import/route.ts` — 五科导入 API 接收 examType
- `src/app/api/class/[classId]/import/route.ts` — 社会导入 API 接收 examType
- `src/components/wuke/wuke-client.tsx` — ImportDialog 增加考试类型 + 考试 tab 徽标
- `src/components/class/score-import-form.tsx` — 社会导入增加考试类型

---
## [2026-07-15] 全面 UI 去 AI 味改造（7项）

### 改动1：换主色
- Primary 从蓝色 `hsl(220,70%,50%)` 改为 **暖褐** `hsl(25,30%,35%)` — 脱离 AI 默认色区间
- 所有交互元素（按钮、导航激活态、焦点环）同步变色

### 改动2：字体分层
- **Display 字体**：引入 `Noto Serif SC`（宋体/学术感），用于 h1/h2/h3
- **Body 字体**：保留 `Noto Sans SC`（可读性最佳）
- **标签字体**：引入 `Outfit`（干净现代无衬线），用于英文/数据标签
- 通过 `next/font/google` 按需加载，无额外请求体积

### 改动3：卡片去边框化
- Card 组件移除默认边框（`border-0`）
- 层级区分靠背景亮度差 + 极淡投影（`shadow-card`）

### 改动4：圆角差异化
- 容器/卡片：`4px`（方正学术）
- 交互控件（按钮/输入框）：`6px`（`--radius: 0.375rem`）
- 两者差异就是设计选择

### 改动5：页面背景温感化
- 背景从冷白 `hsl(0,0%,98%)` 改为 **暖象牙** `hsl(40,8%,95%)`
- 所有卡片/弹窗背景同步偏暖
- 所有 border 色从冷灰改为暖灰 `hsl(40,6%,80%)`

### 改动6：微交互注入个性
- **表格行 hover**：左侧 3px 暖褐色条展开（`row-accent` 类）
- **CSS 动画系统**：新增 slideUp / scaleIn / scorePop 动画
- **分类进入**：stagger-section 系列（prepare for sections）
- 应用到 wuke 表格行 + dashboard 表格行 + class-detail 表格行

### 改动7：偏科分析对话框升级
- Tab 切换从 bg-muted 色块改为 **下划线指示器**（`tab-underline`）
- DialogTitle 使用 display 字体
- 所有图表网格线/提示框颜色从冷灰改为暖灰（`#e4ddd5` / `#ede8e0`）

### 涉及文件
- `src/app/globals.css` — 全部 CSS 变量重写 + 动画 keyframes + row-accent / tab-underline 工具类
- `tailwind.config.ts` — 新增 fontFamily（display/label）+ borderRadius.card + 新动画
- `src/app/layout.tsx` — 引入 Noto Serif SC / Outfit 字体
- `src/components/ui/card.tsx` — border-0 + rounded-[4px]
- `src/components/ui/dialog.tsx` — rounded-[4px]
- `src/components/layout/shell.tsx` — brand 使用 font-display
- `src/components/wuke/wuke-client.tsx` — tab 下划线、chart 暖色、表格行 row-accent
- `src/app/page.tsx` — dashboard 表格行 row-accent
- `src/components/class/class-detail-client.tsx` — 表格行 row-accent
