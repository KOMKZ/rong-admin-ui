# 组件目录

## 组件分层

| 层级             | 定位     | 组件                                                                                                                                                                                                                          |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| layout           | 页面骨架 | RPage, RListPage, RFormPage, RDetailPage, RSectionCard                                                                                                                                                                        |
| business-neutral | 中台组件 | RDataTable, RFormRenderer, RModalDialog, RResourcePickerDialog, RFileUpload, RProUpload, RMediaResourceUpload, RImageCropUpload, RMoneyText, RMoneyInput, RJsonViewer, RProTreeEditor, RDashboardBuilder, RDashboardWorkspace |

## 组件清单

### RPage / RListPage / RFormPage / RDetailPage / RSectionCard

- **文件**: `src/components/page-layout/`
- **契约**: `src/components/page-layout/types.ts`
- **规格文档**: `features/page-layout.md`
- **测试**: `tests/components/page-layout.test.ts`
- **消费方调用**: `hrise-admin-web/src/views/**`

### RDataTable

- **文件**: `src/components/data-table/RDataTable.vue`
- **契约**: `src/components/data-table/types.ts`
- **规格文档**: `components/spec-data-table.md`
- **测试**: `tests/components/data-table.test.ts` (12 tests)
- **a11y**: `tests/components/a11y.test.ts` (3 tests)
- **消费方调用**: `rong-admin-webdemo/src/stories/DataTableStory.vue`

### RFormRenderer

- **文件**: `src/components/form-renderer/RFormRenderer.vue`
- **契约**: `src/components/form-renderer/types.ts`
- **规格文档**: `components/spec-form-renderer.md`
- **测试**: `tests/components/form-renderer.test.ts` (13 tests)
- **a11y**: `tests/components/a11y.test.ts` (2 tests)
- **消费方调用**: `rong-admin-webdemo/src/stories/FormRendererStory.vue`

### RModalDialog

- **文件**: `src/components/modal-dialog/RModalDialog.vue`
- **契约**: `src/components/modal-dialog/types.ts`
- **测试**: `tests/components/modal-dialog.test.ts` (12 tests)
- **a11y**: `tests/components/a11y.test.ts` (2 tests)
- **消费方调用**: `rong-admin-webdemo/src/stories/ModalDialogStory.vue`

### RResourcePickerDialog

- **文件**: `src/components/resource-picker/RResourcePickerDialog.vue`
- **契约**: `src/components/resource-picker/types.ts`
- **规格文档**: `components/spec-resource-picker.md`
- **消费方调用**: `hrise-admin-web/src/components/resource-picker/SystemResourcePicker.vue`

### RFileUpload

- **文件**: `src/components/file-upload/RFileUpload.vue`
- **契约**: `src/components/file-upload/types.ts`
- **测试**: `tests/components/file-upload.test.ts` (11 tests)
- **a11y**: `tests/components/a11y.test.ts` (2 tests)
- **消费方调用**: `rong-admin-webdemo/src/stories/FileUploadStory.vue`

### RImageCropUpload

- **文件**: `src/components/image-crop-upload/RImageCropUpload.vue`
- **契约**: `src/components/image-crop-upload/types.ts`
- **规格文档**: `components/spec-image-crop-upload.md`
- **测试**: `tests/components/image-crop-upload.test.ts`, `tests/components/image-crop-upload-utils.test.ts`
- **消费方调用**: `hrise-admin-web/src/views/admin/components/AdminAvatarUpload.vue`

### RMediaResourceUpload

- **文件**: `src/components/media-resource-upload/RMediaResourceUpload.vue`
- **契约**: `src/components/media-resource-upload/types.ts`
- **规格文档**: `components/spec-media-resource-upload.md`
- **测试**: `tests/components/media-resource-upload.test.ts`
- **消费方调用**: `hrise-admin-web/src/views/v3/content-creation/templates/edit.vue`

### RMoneyText / RMoneyInput

- **文件**: `src/components/money/`
- **契约**: `src/components/money/types.ts`
- **规格文档**: `components/spec-money.md`
- **测试**: `tests/components/money.test.ts`
- **消费方调用**: `hrise-admin-web/src/views/shop/**`

### RJsonViewer

- **文件**: `src/components/json-viewer/RJsonViewer.vue`
- **契约**: `src/components/json-viewer/types.ts`
- **规格文档**: `components/spec-json-viewer.md`
- **测试**: `tests/components/json-viewer.test.ts`
- **消费方调用**: `hrise-admin-web/src/views/ai-task-workflows/components/WorkflowFlowViewer.vue`

### RProTreeEditor

- **文件**: `src/components/pro-tree-editor/RProTreeEditor.vue`
- **契约**: `src/components/pro-tree-editor/types.ts`
- **规格文档**: `components/spec-pro-tree-editor.md`
- **测试**: `tests/components/pro-tree-editor/useTreeData.test.ts` (12 tests), `useTreeDnd.test.ts` (7 tests), `useTreeSearch.test.ts` (7 tests), `articleFolderAdapter.test.ts` (7 tests)
- **消费方调用**: `rong-admin-web/src/views/article-folders/ArticleFoldersView.vue`

### RDashboardBuilder

- **文件**: `src/components/dashboard-builder/RDashboardBuilder.vue`
- **契约**: `src/components/dashboard-builder/types.ts`
- **测试**: `tests/components/dashboard-builder.test.ts`
- **消费方调用**: `rong-admin-web/src/views/dashboard/index.vue`

### RDashboardWorkspace

- **文件**: `src/components/dashboard-builder/RDashboardWorkspace.vue`
- **契约**: `src/components/dashboard-builder/types.ts`
- **测试**: `tests/components/dashboard-workspace.test.ts`
- **消费方调用**: `rong-admin-web/src/views/dashboard/index.vue`

### RRouteQuickActionsWidget / RRouteQuickActionsEditor

- **文件**: `src/components/dashboard-builder/widgets/route-quick-actions/`
- **契约**: `src/components/dashboard-builder/widgets/route-quick-actions/types.ts`
- **测试**: `tests/components/route-quick-actions-widget.test.ts`
- **消费方调用**: `rong-admin-web/src/views/dashboard/index.vue`

### RRouteButton

- **文件**: `src/components/route-button/RRouteButton.vue`
- **契约**: `src/components/route-button/types.ts`
- **规格文档**: `components/spec-route-button.md`
- **测试**: `tests/components/route-button.test.ts` (6 tests)
- **消费方调用**: `hrise-admin-web/src/views/**`（页面 CTA，ticket 000487 起接入）
- **说明**: 页面路由按钮原语；配合 `RRowActions` 的 `kind: 'route' | 'link'` action 与 `RTabsView` 真实链接页签，构成后台原生链接导航协议（`navigation/link-rel.ts` 是 `_blank` 安全 rel 的唯一决定位置）。

### RRowActions

- **文件**: `src/components/row-actions/RRowActions.vue`
- **契约**: `src/components/row-actions/types.ts`
- **测试**: `tests/components/row-actions.test.ts` (12 tests)
- **消费方调用**: `hrise-admin-web/src/views/**`
- **说明**: 行操作动作是 `command | route | link` 可判别联合；route/link 输出真实 anchor（inline 与 overflow Dropdown 同协议），command 保持按钮。

## 组件依赖

所有组件依赖 `naive-ui` (peer dependency)，无框架层内部模块依赖。
