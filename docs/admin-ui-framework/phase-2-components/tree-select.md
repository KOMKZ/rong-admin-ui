# RTreeSelect — 通用层级选择器

## 概述

通用树形选择器组件，用于在下拉面板中展示和选择层级数据。不包含业务逻辑，可用于文件夹选择、分类选择、组织架构选择等场景。

## 安装

```ts
import { RTreeSelect } from '@rong/admin-ui'
import type { TreeSelectNode, RTreeSelectProps } from '@rong/admin-ui'
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | `string \| number \| null` | — | 当前选中值 (v-model) |
| options | `TreeSelectNode[]` | `[]` | 静态树数据 |
| loadData | `() => Promise<TreeSelectNode[]>` | — | 异步加载函数 |
| placeholder | `string` | `'Please select'` | 占位文本 |
| disabled | `boolean` | `false` | 禁用 |
| clearable | `boolean` | `true` | 可清除 |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸 |
| searchable | `boolean` | `true` | 可搜索 |
| defaultExpandLevel | `number` | `1` | 默认展开层级 |
| maxHeight | `number \| string` | `320` | 下拉面板最大高度 |
| i18n | `TreeSelectI18n` | — | 国际化文本 |

## Events

| Event | 参数 | 说明 |
|-------|------|------|
| update:modelValue | `string \| number \| null` | 选中值变化 |
| select | `TreeSelectNode \| null` | 选中节点（含完整数据） |
| clear | — | 清除选择 |

## Expose

| Method | 说明 |
|--------|------|
| reload() | 重新加载异步数据 |
| open() | 打开下拉 |
| close() | 关闭下拉 |
| getSelectedNode() | 获取当前选中节点 |

## Slots

| Slot | 参数 | 说明 |
|------|------|------|
| node-label | `{ node, depth }` | 自定义节点标签 |
| node-icon | `{ node, expanded }` | 自定义节点图标 |
| trigger | `{ selectedNode, open }` | 自定义触发器 |
| empty | — | 自定义空状态 |

## TreeSelectNode 接口

```ts
interface TreeSelectNode {
  id: string | number
  label: string
  parentId: string | number | null
  children?: TreeSelectNode[]
  disabled?: boolean
  icon?: string
  [key: string]: unknown
}
```

## 使用示例

### 静态数据

```vue
<RTreeSelect
  v-model="selected"
  :options="treeData"
  placeholder="选择分类"
/>
```

### 异步加载

```vue
<RTreeSelect
  v-model="selected"
  :load-data="fetchCategories"
  :i18n="{ placeholder: '选择分类', search: '搜索...', noData: '暂无数据' }"
/>
```

## 设计决策

- **无业务耦合**：不依赖特定 API 或数据格式，通过 `loadData` 回调由消费方适配
- **语义 Token**：全部颜色来自 CSS 变量，支持主题切换
- **搜索过滤**：自动展开匹配路径的祖先节点
- **键盘可达**：支持 Enter/Space/Escape/Arrow 操作
- **错误恢复**：异步加载失败时显示重试按钮
