# v0.6 商业化组件文档

> 本文档覆盖 v0.6 迭代新增的商业化组件，包含概述、使用场景、API、A11y、性能建议和示例矩阵。

---

## RIcon

### 概述

`RIcon` 是统一的图标组件，基于 `lucide-vue-next` 封装，提供一致的尺寸、颜色和风格。

### 何时使用

- 需要在菜单、按钮、状态指示器中显示图标时
- 需要统一的图标风格和尺寸规范时
- 需要语义化颜色映射时（如 success/warning/danger）

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | - | 图标名称（Lucide 图标名，如 `home`, `users`, `settings`） |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| number` | `'md'` | 图标尺寸 |
| `color` | `'inherit' \| 'primary' \| 'secondary' \| 'tertiary' \| 'brand' \| 'success' \| 'warning' \| 'danger' \| 'info' \| string` | `'inherit'` | 图标颜色 |
| `strokeWidth` | `number` | `2` | 线条粗细 |

### A11y

- 图标默认为装饰性（`aria-hidden="true"`），需配合文字标签使用
- 若图标为唯一交互元素，需在父元素添加 `aria-label`

### 性能建议

- 图标组件按需注册，未注册的图标会显示 fallback
- 避免在列表中频繁切换图标名称

### 示例矩阵

| 场景 | 示例 |
|------|------|
| 基础 | `<RIcon name="home" />` |
| 尺寸 | `<RIcon name="home" size="lg" />` |
| 颜色 | `<RIcon name="check" color="success" />` |
| 状态 | `<RIcon name="alert-circle" color="danger" />` |

---

## RPageHeader

### 概述

`RPageHeader` 是商业化页面头部组件，支持标题、描述、面包屑、返回按钮、状态指示和操作区。

### 何时使用

- 需要统一的页面标题展示时
- 需要面包屑导航时
- 需要页面级操作按钮时
- 需要显示页面状态（如草稿、已发布）时

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | - | 页面标题 |
| `description` | `string` | - | 页面描述 |
| `breadcrumbs` | `BreadcrumbItem[]` | - | 面包屑数据 |
| `showBack` | `boolean` | `false` | 是否显示返回按钮 |
| `backLabel` | `string` | `'Back'` | 返回按钮文字 |
| `status` | `'draft' \| 'published' \| 'archived' \| 'error'` | - | 状态指示 |
| `statusLabel` | `string` | - | 状态文字 |
| `sticky` | `boolean` | `false` | 是否吸顶 |

### Slots

| 名称 | 说明 |
|------|------|
| `actions` | 操作按钮区域 |
| `extra` | 额外内容区域 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `back` | - | 点击返回按钮时触发 |
| `breadcrumb-click` | `item: BreadcrumbItem` | 点击面包屑项时触发 |

### A11y

- 标题使用 `<h1>` 语义标签
- 面包屑使用 `nav[aria-label="Breadcrumb"]` 和 `ol` 结构
- 返回按钮具有明确的 `aria-label`

### 性能建议

- `sticky` 模式会触发 `position: sticky`，在复杂布局中注意 stacking context
- 面包屑数据变化时会触发重渲染，建议使用 computed 稳定引用

### 示例矩阵

| 场景 | 说明 |
|------|------|
| 基础 | 标题 + 描述 |
| 带操作 | 标题 + 操作按钮 |
| 带状态 | 标题 + 状态标签 |
| 带面包屑 | 标题 + 面包屑导航 |
| 吸顶 | 滚动时固定在顶部 |

---

## RStatCard

### 概述

`RStatCard` 是单个指标卡片组件，用于展示关键业务数据。

### 何时使用

- 展示 KPI、统计数据时
- 需要显示趋势变化时
- Dashboard 数据概览区域

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | - | 指标名称 |
| `value` | `string \| number` | - | 指标值 |
| `prefix` | `string` | - | 值前缀（如 ¥） |
| `suffix` | `string` | - | 值后缀（如 %） |
| `icon` | `string` | - | 图标名称 |
| `trend` | `'up' \| 'down' \| 'flat'` | - | 趋势方向 |
| `trendValue` | `string` | - | 趋势数值（如 +12%） |
| `trendLabel` | `string` | - | 趋势描述 |
| `description` | `string` | - | 补充说明 |
| `loading` | `boolean` | `false` | 加载状态 |
| `clickable` | `boolean` | `false` | 是否可点击 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸 |
| `variant` | `'default' \| 'outlined' \| 'filled'` | `'default'` | 样式变体 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `click` | - | 点击卡片时触发（需 clickable=true） |

### A11y

- 可点击时具有 `tabindex="0"` 和键盘支持
- 趋势图标配有 `aria-label` 说明趋势方向

### 性能建议

- 大量卡片时建议使用 `RKpiGrid` 统一管理
- `loading` 状态使用骨架屏，避免布局抖动

### 示例矩阵

| 场景 | 说明 |
|------|------|
| 基础 | 标题 + 值 |
| 带趋势 | 显示上升/下降趋势 |
| 带图标 | 左侧显示图标 |
| 可点击 | 点击跳转详情 |
| 加载中 | 骨架屏状态 |

---

## RKpiGrid

### 概述

`RKpiGrid` 是指标卡片网格组件，用于批量展示多个 `RStatCard`。

### 何时使用

- Dashboard 顶部数据概览
- 多个 KPI 并排展示
- 需要响应式网格布局时

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | `KpiItem[]` | - | 指标数据数组 |
| `cols` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `4` | 列数 |
| `loading` | `boolean` | `false` | 全局加载状态 |
| `gap` | `string` | `'var(--ra-spacing-4)'` | 间距 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `item-click` | `key: string` | 点击某个卡片时触发 |

### A11y

- 网格使用 CSS Grid，响应式断点自动调整列数
- 每个卡片继承 `RStatCard` 的无障碍特性

### 性能建议

- 超过 8 个指标时考虑分组或分页
- 使用 `key` 属性确保列表渲染优化

---

## RDrawerForm

### 概述

`RDrawerForm` 是抽屉表单组件，结合 `NDrawer` 和 `RFormRenderer`，适用于新建/编辑场景。

### 何时使用

- 在当前页面侧边创建/编辑记录
- 表单内容较多，不适合弹窗时
- 需要保持当前页面上下文时

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | - | 是否显示（v-model） |
| `title` | `string` | - | 抽屉标题 |
| `width` | `'small' \| 'medium' \| 'large' \| 'xlarge' \| number` | `'medium'` | 抽屉宽度 |
| `placement` | `'left' \| 'right'` | `'right'` | 出现位置 |
| `schema` | `FormFieldSchema[]` | - | 表单字段配置 |
| `model` | `Record<string, unknown>` | - | 表单数据（v-model） |
| `submitText` | `string` | `'Submit'` | 提交按钮文字 |
| `cancelText` | `string` | `'Cancel'` | 取消按钮文字 |
| `loading` | `boolean` | `false` | 提交中状态 |
| `validateOnSubmit` | `boolean` | `true` | 提交时是否校验 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | `boolean` | 显示状态变化 |
| `update:model` | `Record<string, unknown>` | 表单数据变化 |
| `submit` | `model: Record<string, unknown>` | 提交表单 |
| `cancel` | - | 取消操作 |

### Expose

| 方法 | 参数 | 说明 |
|------|------|------|
| `validate` | - | 触发表单校验 |
| `resetFields` | - | 重置表单 |

### A11y

- 抽屉打开时聚焦管理，关闭时恢复焦点
- ESC 键可关闭抽屉
- 表单继承 `RFormRenderer` 的无障碍特性

### 性能建议

- 抽屉内容使用懒加载，打开时才渲染表单
- 复杂表单考虑分步骤展示

---

## REmptyState

### 概述

`REmptyState` 是空状态组件，用于数据为空时的占位展示。

### 何时使用

- 列表/表格数据为空时
- 搜索无结果时
- 新用户引导

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icon` | `string` | `'inbox'` | 图标名称 |
| `title` | `string` | `'No data'` | 标题 |
| `description` | `string` | - | 描述文字 |
| `actionLabel` | `string` | - | 操作按钮文字 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸 |

### Slots

| 名称 | 说明 |
|------|------|
| `icon` | 自定义图标 |
| `default` | 自定义操作区域 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `action` | - | 点击操作按钮 |

### A11y

- 图标为装饰性，不参与可访问性树
- 操作按钮可键盘访问

---

## RResultState

### 概述

`RResultState` 是结果状态组件，用于展示操作结果或错误页面。

### 何时使用

- 操作成功/失败反馈
- 404/403/500 等错误页面
- 提交完成确认页

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `status` | `'success' \| 'error' \| 'info' \| 'warning' \| '404' \| '403' \| '500'` | `'info'` | 状态类型 |
| `title` | `string` | - | 标题 |
| `description` | `string` | - | 描述 |
| `showIcon` | `boolean` | `true` | 是否显示图标 |

### Slots

| 名称 | 说明 |
|------|------|
| `icon` | 自定义图标 |
| `actions` | 操作按钮区域 |
| `extra` | 额外内容 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `action` | `type: string` | 操作按钮点击 |

---

## RCommandPalette

### 概述

`RCommandPalette` 是全局命令面板组件，支持快捷键唤起、搜索和键盘导航。

### 何时使用

- 全局快速导航
- 搜索命令/页面
- 键盘优先的操作入口

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | - | 是否显示（v-model） |
| `items` | `CommandItem[]` | - | 命令列表 |
| `placeholder` | `string` | `'Type a command or search...'` | 搜索框占位符 |
| `loading` | `boolean` | `false` | 加载状态 |
| `emptyText` | `string` | `'No results found'` | 空结果提示 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | `boolean` | 显示状态变化 |
| `select` | `item: CommandItem` | 选择命令 |

### Keyboard

| 快捷键 | 说明 |
|--------|------|
| `⌘K` / `Ctrl+K` | 打开面板 |
| `↑` / `↓` | 导航 |
| `Enter` | 执行选中项 |
| `Esc` | 关闭面板 |

### A11y

- 面板为模态，打开时捕获焦点
- 列表项具有 `role="option"`
- 键盘完全可操作

### 性能建议

- 命令列表建议控制在 100 项以内
- 搜索使用防抖，避免频繁过滤
- 大列表考虑虚拟滚动

---

## 商业后台模板页

### 列表页模板

典型结构：
```
┌─────────────────────────────────────┐
│ RPageHeader (标题 + 操作按钮)        │
├─────────────────────────────────────┤
│ 筛选区 (RFilterBar / 搜索框)         │
├─────────────────────────────────────┤
│ RDataTable (数据列表)                │
├─────────────────────────────────────┤
│ 分页                                 │
└─────────────────────────────────────┘
```

对应实例：`rong-admin-webdemo/src/views/UserManagement.vue`

### Dashboard 页模板

典型结构：
```
┌─────────────────────────────────────┐
│ RPageHeader (Dashboard + 刷新/导出)  │
├─────────────────────────────────────┤
│ RKpiGrid (4 列指标卡)                │
├─────────────────────────────────────┤
│ 图表区 / 概览卡片                     │
├─────────────────────────────────────┤
│ 活动列表 / REmptyState               │
└─────────────────────────────────────┘
```

对应实例：`rong-admin-webdemo/src/views/DashboardPage.vue`

### 详情页模板

典型结构：
```
┌─────────────────────────────────────┐
│ RPageHeader (返回 + 标题 + 状态)     │
├─────────────────────────────────────┤
│ 详情内容 (卡片分组)                   │
├─────────────────────────────────────┤
│ 相关数据 / 操作记录                   │
└─────────────────────────────────────┘
```

对应实例：待补充

---

## 迁移指南

### 从 emoji 图标迁移到 RIcon

```vue
<!-- Before -->
<span>🏠</span>

<!-- After -->
<RIcon name="home" size="sm" />
```

### 从 NStatistic 迁移到 RStatCard

```vue
<!-- Before -->
<NCard>
  <NStatistic label="Users" :value="1024" />
</NCard>

<!-- After -->
<RStatCard
  title="Users"
  :value="1024"
  icon="users"
  trend="up"
  trend-value="+12%"
/>
```

### 从 RModalDialog 迁移到 RDrawerForm

```vue
<!-- Before -->
<RModalDialog v-model:visible="visible" title="Edit">
  <NForm>...</NForm>
</RModalDialog>

<!-- After -->
<RDrawerForm
  v-model:visible="visible"
  title="Edit"
  :schema="formSchema"
  :model="formData"
  @submit="handleSubmit"
/>
```
