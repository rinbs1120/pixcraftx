# 项目上下文 - ColorForge

## 项目概述

**ColorForge** 是一个 AI 涂色页生成器，面向海外用户（美/加/英/澳），帮助家长、老师和 KDP 卖家快速创建可打印的涂色页。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Auth**: Clerk
- **Database**: Supabase
- **AI**: Fal.ai

### 品牌配色

- **主色**: #FFB800 (明黄)
- **辅色**: #1A1A2E (深灰)
- **强调**: #FF6B6B (珊瑚橙)
- **背景**: #FFFBF0 (暖白)
- **成功**: #2ECC71 (绿)

### 字体

- **标题**: Fredoka One
- **正文**: Inter
- **代码**: JetBrains Mono

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── generate/       # 工具页
│   │   ├── pricing/        # 定价页
│   │   ├── about/          # 关于页
│   │   ├── privacy/        # 隐私政策
│   │   └── terms/          # 服务条款
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   ├── navbar.tsx      # 导航栏
│   │   ├── footer.tsx      # 页脚
│   │   └── sections/       # 首页区块组件
│   ├── hooks/              # 自定义 Hooks
│   └── lib/                # 工具库
├── DESIGN.md               # 设计规范文档
├── next.config.ts          # Next.js 配置
└── package.json            # 项目依赖管理
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 所有文案使用英文（面向海外用户）

### 组件规范

- 首页区块组件放在 `src/components/sections/` 目录
- 共享组件（Navbar, Footer）放在 `src/components/` 目录
- 使用 shadcn/ui 组件和规范

### 样式规范

- 使用 Tailwind CSS 语义化变量（bg-background, text-foreground）
- 禁止硬编码颜色值（Hex/RGB）
- 禁止使用蓝紫色渐变（AI 味）

## 页面路由

| 路由 | 描述 |
|------|------|
| `/` | 首页（Landing Page） |
| `/generate` | 工具页（生成涂色页） |
| `/pricing` | 定价页 |
| `/about` | 关于页 |
| `/privacy` | 隐私政策 |
| `/terms` | 服务条款 |

## 环境变量

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk 公钥
CLERK_SECRET_KEY=                   # Clerk 密钥
NEXT_PUBLIC_SUPABASE_URL=           # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase 匿名密钥
SUPABASE_SERVICE_ROLE_KEY=          # Supabase 服务密钥
FAL_KEY=                            # Fal.ai API 密钥
```
