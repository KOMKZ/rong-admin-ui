# 组件目录

## 组件分层

| 层级             | 定位     | 组件                                                                                                                                       |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| layout           | 页面骨架 | RPage, RListPage, RFormPage, RDetailPage, RSectionCard                                                                                     |
| business-neutral | 中台组件 | RDataTable, RFormRenderer, RModalDialog, RFileUpload, RProUpload, RImageCropUpload, RMoneyText, RMoneyInput, RJsonViewer, RProTreeEditor, RDashboardBuilder, RDashboardWorkspace |

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

## 组件依赖

所有组件依赖 `naive-ui` (peer dependency)，无框架层内部模块依赖。
