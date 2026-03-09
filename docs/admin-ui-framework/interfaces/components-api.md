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

## ProTreeEditor

| 接口 | 路径 | 说明 |
|------|------|------|
| TreeNodeData | components/pro-tree-editor/types.ts | 树节点数据结构（id/label/parentId/sortOrder/depth/children） |
| TreeDensity | components/pro-tree-editor/types.ts | 视觉密度：compact \| default \| comfortable |
| TreeRequestMode | components/pro-tree-editor/types.ts | 请求模式：auto \| manual |
| TreeNodeState | components/pro-tree-editor/types.ts | 节点状态联合类型（10 种状态） |
| TreeErrorCode | components/pro-tree-editor/types.ts | 领域错误码（DUPLICATE_NAME/CIRCULAR_REFERENCE 等） |
| TreeError | components/pro-tree-editor/types.ts | 错误对象（code/message/nodeId/raw） |
| TreeRequestHooks | components/pro-tree-editor/types.ts | 后端请求钩子（loadTree/create/update/delete/move/reorder） |
| CheckDeleteFn | components/pro-tree-editor/types.ts | 删除前约束检查函数 |
| DeleteConstraint | components/pro-tree-editor/types.ts | 删除约束结果（canDelete/reason/childCount/articleCount） |
| TreeRequestEvent | components/pro-tree-editor/types.ts | 请求生命周期事件 |
| TreeDataChangeEvent | components/pro-tree-editor/types.ts | 数据变更事件（type/node/nodes） |
| TreeNodeIcons | components/pro-tree-editor/types.ts | 自定义图标配置 |
| TreeBatchConfig | components/pro-tree-editor/types.ts | 批量操作配置 |
| TreeI18n | components/pro-tree-editor/types.ts | 国际化文案覆盖（45 个字段） |
| ProTreeEditorProps | components/pro-tree-editor/types.ts | 组件 Props 完整定义（16 个属性） |
| ProTreeEditorEmits | components/pro-tree-editor/types.ts | 组件事件定义（7 个事件） |
| ProTreeEditorExpose | components/pro-tree-editor/types.ts | 组件暴露方法（10 个方法） |
| ProTreeEditorSlots | components/pro-tree-editor/types.ts | 组件插槽定义（8 个插槽） |
| DropPosition | components/pro-tree-editor/types.ts | 拖放位置：before \| inside \| after |
| DropInfo | components/pro-tree-editor/types.ts | 拖放信息（dragNodeId/targetNodeId/position/isLegal） |
| TreeHttpClient | components/pro-tree-editor/adapters/articleFolderAdapter.ts | 适配器 HTTP 客户端接口 |
| ArticleFolderAdapterOptions | components/pro-tree-editor/adapters/articleFolderAdapter.ts | 文章分类适配器配置 |

## DashboardBuilder

| 接口 | 路径 | 说明 |
|------|------|------|
| DashboardSizePreset | components/dashboard-builder/types.ts | 组件尺寸预设（key/label/w/h） |
| DashboardBreakpoint | components/dashboard-builder/types.ts | 断点类型（lg/md/sm） |
| DashboardRect | components/dashboard-builder/types.ts | 断点布局坐标（x/y/w/h） |
| DashboardResponsiveColumns | components/dashboard-builder/types.ts | 断点列数配置 |
| DashboardWidgetDefinition | components/dashboard-builder/types.ts | Widget 定义（类型、标题、默认尺寸、可见性） |
| DashboardWidgetRegistryEntry | components/dashboard-builder/types.ts | Widget 注册项（renderer/editor） |
| DashboardRouteOption | components/dashboard-builder/types.ts | 路由选项定义（label/value/description） |
| DashboardLayoutItem | components/dashboard-builder/types.ts | 布局项（id/type/x/y/w/h/config/responsive） |
| DashboardDefinition | components/dashboard-builder/types.ts | Dashboard 元数据（id/name/description） |
| DashboardBuilderAdapter | components/dashboard-builder/types.ts | 适配器接口（load/save/list） |
| DashboardWorkspaceAdapter | components/dashboard-builder/types.ts | 工作区适配器（list/create/delete/load/save/listWidgets） |
| DashboardBuilderProps | components/dashboard-builder/types.ts | 组件 Props 定义 |
| DashboardBuilderEmits | components/dashboard-builder/types.ts | 组件事件定义（layout-change/saved/error） |
| DashboardBuilderExpose | components/dashboard-builder/types.ts | 组件暴露方法（reload/save/toggle/getLayout） |
| DashboardExportPayload | components/dashboard-builder/types.ts | 导入导出 JSON 结构 |

## RouteQuickActionsWidget

| 接口 | 路径 | 说明 |
|------|------|------|
| RouteQuickActionItem | components/dashboard-builder/widgets/route-quick-actions/types.ts | 快捷按钮项（id/label/route） |
| RouteQuickActionsWidgetConfig | components/dashboard-builder/widgets/route-quick-actions/types.ts | Widget 配置（title/description/actions） |
| RouteQuickActionsEditorOptions | components/dashboard-builder/widgets/route-quick-actions/types.ts | 编辑器选项（routeOptions） |
