# DESIGN.md - ColorForge 设计规范

## 品牌与视觉方向

### 产品定位
ColorForge 是 AI 涂色页生成器，面向家长、老师和 KDP 卖家。设计风格需"温暖但不幼稚、专业但不冰冷"——涂色页是给孩子的，但付款的是家长/老师/卖家。

### 气质与意象
- **关键词**：温暖、创造力、阳光、童趣、专业
- **意象场景**：午后阳光洒在白色画纸上，孩子拿着蜡笔专注涂色，空气中漂浮着微尘
- **视觉策略**：暖白背景 + 明黄主色 + 深灰专业感，用渐变和光晕营造温馨氛围

## Design Tokens

### 色彩

| 用途 | 色值 | 说明 |
|------|------|------|
| **主色-明黄** | `#FFB800` | 温暖、创造力、阳光，涂色=色彩 |
| **辅色-深灰** | `#1A1A2E` | 专业、文字、深色区域 |
| **强调-珊瑚橙** | `#FF6B6B` | CTA 按钮、重要提示 |
| **背景-暖白** | `#FFFBF0` | 温暖不刺眼 |
| **成功绿** | `#2ECC71` | 免费标签、成功状态 |
| **渐变** | `#FFB800 → #FF6B6B` | 按钮渐变，从明黄到珊瑚橙 |

### 字体

| 用途 | 字体 | 说明 |
|------|------|------|
| 标题/Hero | **Fredoka One** | 圆润友好，有童趣但不幼稚 |
| 正文 | **Inter** | 清晰专业，Google Fonts 免费 |
| 代码/数据 | **JetBrains Mono** | 数字对齐 |

### 间距

基于 4px 网格：
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 24px
- `--space-6`: 32px
- `--space-8`: 48px
- `--space-10`: 64px
- `--space-12`: 80px

### 圆角

- `--radius-sm`: 6px
- `--radius-md`: 10px
- `--radius-lg`: 16px
- `--radius-xl`: 24px
- `--radius-full`: 9999px

### 阴影

- `--shadow-sm`: `0 1px 3px rgba(26,26,46,0.06)`
- `--shadow-md`: `0 4px 12px rgba(26,26,46,0.08)`
- `--shadow-lg`: `0 8px 24px rgba(26,26,46,0.12)`
- `--shadow-xl`: `0 16px 48px rgba(26,26,46,0.16)`
- `--shadow-button`: `0 2px 8px rgba(255,184,0,0.3)`

## 布局与响应式

### 断点

- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: >= 1024px

### 容器

- 最大宽度：1200px
- 内边距：24px (mobile) → 48px (desktop)

## 组件规范

### 按钮

1. **Primary Button**（主要按钮）
   - 背景：渐变 `#FFB800 → #FF6B6B`
   - 文字：深灰 `#1A1A2E`
   - 圆角：`--radius-full`
   - 阴影：`--shadow-button`
   - Hover：亮度提升 5%，上移 2px

2. **Secondary Button**（次要按钮）
   - 背景：透明
   - 边框：2px solid `#E8E0D0`
   - 文字：深灰
   - Hover：边框变为主色

### 卡片

- 背景：白色 `#FFFFFF`
- 圆角：`--radius-lg`
- 阴影：`--shadow-sm`
- Hover：上移 4px，阴影加深

### 输入框

- 背景：白色
- 边框：2px solid `#E8E0D0`
- Focus：边框变为主色 `#FFB800`，添加光晕阴影

## 动效与交互

### 过渡

- Fast: 150ms
- Normal: 250ms
- Slow: 500ms

### 缓动曲线

- Default: `cubic-bezier(0.4, 0, 0.2, 1)`
- Out: `cubic-bezier(0, 0, 0.2, 1)`
- Bounce: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### 页面加载

- Hero 文字淡入：800ms，延迟 500ms
- Hero 卡片淡入：800ms，延迟 700ms
- 滚动触发：IntersectionObserver

## 设计禁忌

- ❌ 不要使用蓝紫色的 AI 味渐变（purple, indigo）
- ❌ 不要使用冷色背景（纯白 #FFFFFF）
- ❌ 不要使用过于幼稚的设计元素
- ❌ 不要使用死板的网格布局
- ❌ 不要使用过小的点击区域（最小 48px）
