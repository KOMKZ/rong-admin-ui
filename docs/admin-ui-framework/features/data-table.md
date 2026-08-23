# DataTable — 数据表格能力

## 背景

后台管理系统的列表页需要统一的表格展示能力：列定义、分页、排序、批量选择、行点击。

## 输入

- `columns: DataTableColumn[]` — 列定义（key/title/width/sortable/render）
- `data: T[]` — 数据源
- `pagination: DataTablePagination | false` — 分页配置
- `checkedRowKeys: DataTableRowKey[]` — 选中行

## 输出

- `update:page` / `update:pageSize` — 分页事件
- `update:checkedRowKeys` — 选择事件
- `update:sort` — 排序事件
- `rowClick` — 行点击事件

## 约束

- 基于 Naive UI NDataTable 封装，要求消费方安装 naive-ui
- 空态自动显示，可通过 empty slot 自定义
- 支持 toolbar / summary / loading / empty 四个插槽
- 行操作优先使用 `RRowActions`；默认 `maxInline=3`，第 4 个及以后动作自动收进“更多”下拉，避免操作列平铺 4 个及以上文字按钮。`ygctl web gen` 默认生成该组件，业务页只需在 `buildRowActions(row)` 追加动作。

## 示例

```vue
<RDataTable
  :columns="columns"
  :data="pageData"
  :pagination="{ page: 1, pageSize: 10, total: 100 }"
  :checked-row-keys="selectedKeys"
  @update:page="handlePageChange"
  @update:checked-row-keys="handleSelect"
  @row-click="handleRowClick"
>
  <template #toolbar>
    <button>批量删除</button>
  </template>
</RDataTable>
```
