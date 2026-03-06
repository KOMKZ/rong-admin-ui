# RDataGrid

基于 AG Grid Community 封装的可编辑数据表格组件。

## 安装依赖

```bash
pnpm add ag-grid-vue3 ag-grid-community
```

## 基本用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RDataGrid, type DataGridColumn } from '@rong/admin-ui/components/data-grid'

const columns = ref<DataGridColumn[]>([
  { field: 'id', headerName: 'ID', editable: false },
  { field: 'name', headerName: '姓名' },
  { field: 'age', headerName: '年龄', type: 'number' },
  { field: 'status', headerName: '状态', type: 'select', options: ['在职', '离职'] },
])

const rows = ref([
  { id: 1, name: '张三', age: 28, status: '在职' },
  { id: 2, name: '李四', age: 32, status: '离职' },
])
</script>

<template>
  <RDataGrid
    :columns="columns"
    :rows="rows"
    height="500px"
    @update:rows="rows = $event"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | `DataGridColumn[]` | (required) | 列定义 |
| rows | `Record<string, unknown>[]` | (required) | 行数据 |
| height | `string \| number` | `'600px'` | 表格高度 |
| readonly | `boolean` | `false` | 只读模式 |
| hideToolbar | `boolean` | `false` | 隐藏工具栏 |
| allowAddRow | `boolean` | `true` | 允许新增行 |
| allowDelete | `boolean` | `true` | 允许删除行 |
| allowExport | `boolean` | `true` | 允许导出 CSV |
| allowColumnDrag | `boolean` | `true` | 允许列拖拽 |
| allowRowDrag | `boolean` | `true` | 允许行拖拽 |
| storageKey | `string` | - | 本地存储键名（过滤条件持久化） |
| locale | `DataGridLocale` | - | 国际化文案 |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| update:rows | `Record<string, unknown>[]` | 行数据变化 |
| update:columns | `DataGridColumn[]` | 列定义变化 |
| cellChange | `{ rowIndex, field, value }` | 单元格值变化 |
| rowAdd | `Record<string, unknown>` | 新增行 |
| rowDelete | `Record<string, unknown>[]` | 删除行 |
| columnAdd | `DataGridColumn` | 新增列 |
| columnDelete | `DataGridColumn` | 删除列 |
| save | `{ columns, rows }` | 保存数据 |

## Expose

| Method | Description |
|--------|-------------|
| `getGridApi()` | 获取 AG Grid API 实例 |
| `getAllRows()` | 获取所有行数据 |
| `addRow()` | 新增行 |
| `deleteSelectedRows()` | 删除选中行 |
| `exportCsv()` | 导出 CSV |
| `getTableData()` | 获取表格结构与数据 |

## DataGridColumn

```ts
interface DataGridColumn {
  field: string
  headerName: string
  type?: 'text' | 'number' | 'date' | 'datetime' | 'year' | 'select' | 'multiselect' | 'boolean'
  width?: number
  editable?: boolean
  sortable?: boolean
  filterable?: boolean
  options?: string[]  // select/multiselect 使用
}
```
