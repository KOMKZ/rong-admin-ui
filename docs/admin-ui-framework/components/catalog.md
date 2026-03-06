# 组件目录

## 组件分层

| 层级 | 定位 | 组件 |
|------|------|------|
| business-neutral | 中台组件 | RDataTable, RFormRenderer, RModalDialog, RFileUpload, RProTreeEditor |

## 组件清单

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

### RProTreeEditor

- **文件**: `src/components/pro-tree-editor/RProTreeEditor.vue`
- **契约**: `src/components/pro-tree-editor/types.ts`
- **规格文档**: `components/spec-pro-tree-editor.md`
- **测试**: `tests/components/pro-tree-editor/useTreeData.test.ts` (12 tests), `useTreeDnd.test.ts` (7 tests), `useTreeSearch.test.ts` (7 tests), `articleFolderAdapter.test.ts` (7 tests)
- **消费方调用**: `rong-admin-web/src/views/article-folders/ArticleFoldersView.vue`

## 组件依赖

所有组件依赖 `naive-ui` (peer dependency)，无框架层内部模块依赖。
