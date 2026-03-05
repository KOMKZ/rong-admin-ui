# 组件接口定义

## DataTable

| 接口 | 路径 | 说明 |
|------|------|------|
| DataTableColumn\<T\> | components/data-table/types.ts | 列定义：key/title/width/sortable/render |
| DataTablePagination | components/data-table/types.ts | 分页：page/pageSize/total/pageSizes |
| DataTableRowKey | components/data-table/types.ts | 行标识：string \| number |
| DataTableSortState | components/data-table/types.ts | 排序状态：columnKey/order |
| DataTableProps\<T\> | components/data-table/types.ts | 组件 Props 完整定义 |
| DataTableEmits\<T\> | components/data-table/types.ts | 组件事件定义 |
| DataTableSlots\<T\> | components/data-table/types.ts | 组件插槽定义 |
| DataTableExpose | components/data-table/types.ts | 组件暴露方法 |

## FormRenderer

| 接口 | 路径 | 说明 |
|------|------|------|
| FormFieldType | components/form-renderer/types.ts | 字段类型枚举 |
| FormFieldSchema | components/form-renderer/types.ts | 字段 schema 定义 |
| FormFieldRule | components/form-renderer/types.ts | 验证规则定义 |
| FormFieldOption | components/form-renderer/types.ts | 选项定义（select/radio/checkbox） |
| FormRendererProps | components/form-renderer/types.ts | 组件 Props 完整定义 |
| FormRendererEmits | components/form-renderer/types.ts | 组件事件定义 |
| FormRendererExpose | components/form-renderer/types.ts | 组件暴露方法 |

## ModalDialog

| 接口 | 路径 | 说明 |
|------|------|------|
| ModalPreset | components/modal-dialog/types.ts | 预设类型枚举 |
| ModalDialogProps | components/modal-dialog/types.ts | 组件 Props 完整定义 |
| ModalDialogEmits | components/modal-dialog/types.ts | 组件事件定义 |
| ModalDialogSlots | components/modal-dialog/types.ts | 组件插槽定义 |
| ModalDialogExpose | components/modal-dialog/types.ts | 组件暴露方法 |

## FileUpload

| 接口 | 路径 | 说明 |
|------|------|------|
| UploadFile | components/file-upload/types.ts | 文件对象（状态机） |
| UploadRequestOptions | components/file-upload/types.ts | 自定义上传请求参数 |
| FileUploadProps | components/file-upload/types.ts | 组件 Props 完整定义 |
| FileUploadEmits | components/file-upload/types.ts | 组件事件定义 |
| FileUploadSlots | components/file-upload/types.ts | 组件插槽定义 |
| FileUploadExpose | components/file-upload/types.ts | 组件暴露方法 |
