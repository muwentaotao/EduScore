# 改动记录

每次改动后，通过 `http://localhost:3000` 本地查看效果。

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
