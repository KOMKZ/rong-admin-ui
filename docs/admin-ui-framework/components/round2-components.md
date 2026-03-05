# Round-2 组件 API 文档

## RFilterBarPro

高级筛选栏组件，支持基础筛选 + 折叠展开 + 快捷筛选 chips + 筛选方案持久化。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| schema | `FormFieldSchema[]` | required | 筛选字段定义 |
| modelValue | `Record<string, unknown>` | required | 当前筛选值 |
| collapsible | `boolean` | `true` | 是否可折叠 |
| defaultCollapsed | `boolean` | `true` | 默认折叠状态 |
| quickFilters | `QuickFilter[]` | `[]` | 快捷筛选按钮 |
| storageKey | `string` | - | localStorage 存储键（启用方案保存） |
| savedSchemes | `FilterScheme[]` | `[]` | 已保存的筛选方案 |
| maxVisibleFields | `number` | `3` | 折叠时显示的字段数 |

### Emits

| Event | Payload | Description |
|-------|---------|-------------|
| update:modelValue | `Record<string, unknown>` | 筛选值变更 |
| search | `Record<string, unknown>` | 点击搜索 |
| reset | - | 点击重置 |
| saveScheme | `{ name, values }` | 保存筛选方案 |
| deleteScheme | `string` | 删除方案 |
| loadScheme | `FilterScheme` | 加载方案 |

### Expose

- `reset()` — 重置所有筛选
- `search()` — 触发搜索
- `getValues()` — 获取当前值
- `setValues(values)` — 设置筛选值
- `toggleAdvanced(expanded?)` — 切换高级筛选

---

## RTableToolbarPro

表格工具栏组件，提供刷新、密度切换、全屏、列配置、导出功能。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | `string` | - | 表格标题 |
| refreshable | `boolean` | `true` | 显示刷新按钮 |
| exportable | `boolean` | `false` | 显示导出按钮 |
| densitySwitchable | `boolean` | `true` | 密度切换 |
| fullscreenable | `boolean` | `true` | 全屏切换 |
| columnConfigurable | `boolean` | `false` | 列配置面板 |
| currentDensity | `'compact'\|'default'\|'comfortable'` | `'default'` | 当前密度 |
| columnPresets | `ColumnPreset[]` | `[]` | 列预设 |
| loading | `boolean` | `false` | 加载中 |

---

## RDescriptionsPanel

结构化详情展示组件，支持分组、列数自适应、状态标签插槽、空值占位。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | `DescriptionItem[]` | `[]` | 平铺描述项 |
| groups | `DescriptionGroup[]` | `[]` | 分组描述项 |
| columns | `number \| ResponsiveConfig` | `3` | 列数 |
| bordered | `boolean` | `false` | 是否有边框 |
| size | `'small'\|'medium'\|'large'` | `'medium'` | 尺寸 |
| layout | `'horizontal'\|'vertical'` | `'horizontal'` | 布局方向 |
| colon | `boolean` | `true` | 显示冒号 |

---

## RProList

卡片/列表双视图切换组件，支持分页、操作区、空态、选中。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `T[]` | required | 数据列表 |
| viewMode | `'card'\|'list'` | `'card'` | 视图模式 |
| pagination | `ProListPagination \| false` | `false` | 分页配置 |
| selectable | `boolean` | `false` | 可选中 |
| actions | `ProListAction[]` | `[]` | 操作按钮 |
| cardMinWidth | `number` | `280` | 卡片最小宽度 |

---

## RStepForm

多步骤表单组件，支持逐步校验、上下步导航、完成态、回滚重置。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| steps | `StepDefinition[]` | required | 步骤定义 |
| modelValue | `Record<string, unknown>` | required | 表单数据 |
| currentStep | `number` | `0` | 当前步骤 |
| disabled | `boolean` | `false` | 禁用表单 |

### Expose

- `next()` — 校验并前进
- `prev()` — 回退
- `submit()` — 提交
- `reset()` — 重置
- `goTo(step)` — 跳转到指定步骤

---

## RPageSkeleton

页面级骨架屏，支持 list/detail/form 三种预设模式。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| mode | `'list'\|'detail'\|'form'` | required | 骨架模式 |
| rows | `number` | `6` | 行数 |
| animated | `boolean` | `true` | 是否有脉冲动画 |
| columns | `number` | `4` | 列数（list 模式） |

---

## RBatchActionBar

批量操作栏组件，选中统计 + 批量操作 + 危险动作二次确认。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| selectedCount | `number` | required | 已选中数量 |
| selectedKeys | `(string\|number)[]` | `[]` | 选中 key 列表 |
| actions | `BatchAction[]` | required | 批量操作列表 |
| countTemplate | `string` | `'已选择 {count} 项'` | 计数文案模板 |
