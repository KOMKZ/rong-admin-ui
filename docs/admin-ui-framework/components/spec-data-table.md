# 组件规格：DataTable

## 1. 基本信息

- 组件名：RDataTable
- 组件层级：business-neutral
- 目标场景：后台管理列表页展示、排序、分页、批量选择
- 非目标场景：复杂电子表格编辑（使用 AG Grid）、树形数据（使用 TreeTable）

## 2. 契约定义

### Props

| 名称 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| columns | `DataTableColumn<T>[]` | - | ✅ | 列定义 |
| data | `T[]` | - | ✅ | 数据源 |
| loading | `boolean` | false | - | 加载态 |
| rowKey | `string \| (row: T) => DataTableRowKey` | 'id' | - | 行唯一标识 |
| pagination | `DataTablePagination \| false` | false | - | 分页配置 |
| bordered | `boolean` | true | - | 边框 |
| striped | `boolean` | false | - | 斑马纹 |
| size | `'small' \| 'medium' \| 'large'` | 'medium' | - | 尺寸 |
| checkedRowKeys | `DataTableRowKey[]` | [] | - | 选中行 |
| emptyText | `string` | '暂无数据' | - | 空态文本 |

### Emits

| 事件名 | Payload | 触发时机 | 说明 |
|--------|---------|----------|------|
| update:page | `number` | 页码变化 | 分页页码 |
| update:pageSize | `number` | 每页数变化 | 分页大小 |
| update:checkedRowKeys | `DataTableRowKey[]` | 选择变化 | 选中行 |
| update:sort | `DataTableSortState` | 排序变化 | 排序状态 |
| rowClick | `[T, number]` | 行点击 | 行数据和索引 |

### Slots

| 名称 | 参数 | 必填 | 回退行为 |
|------|------|------|----------|
| empty | - | - | 显示 emptyText |
| loading | - | - | 显示默认骨架屏 |
| toolbar | - | - | 不显示 |
| summary | - | - | 不显示 |

## 3. 状态与交互

- 正常态：数据列表渲染
- 加载态：骨架屏或 spinner
- 空态：空态插图 + 文本
- 错误态：由外部控制（error slot 或外部提示）
- 禁用态：不适用

## 4. 可访问性

- 键盘路径：Tab 进入表格 → 方向键导航行/列 → Enter 触发行点击
- ARIA 语义：`role="table"`, `role="row"`, `role="columnheader"`, `role="cell"`
- 对比度要求：WCAG AA

## 5. 性能预算

- 首次渲染：100 行 < 50ms
- 交互响应：排序/分页 < 100ms
- 重渲染阈值：数据变化时仅更新变化行

## 6. 测试要求

- 单元测试：列渲染、分页、排序、选择
- 契约测试：props/emits 类型验证
- E2E 场景：加载 → 分页 → 排序 → 选择 → 行点击
- a11y 检查：键盘导航、ARIA 标记

## 7. 验收标准

- [x] 契约完整（types.ts）
- [ ] 组件实现
- [ ] 文档与示例可运行
- [ ] 测试通过
- [ ] rong-admin-webdemo 至少 1 个真实调用
