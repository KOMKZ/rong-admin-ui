# Frontend Structure Gate Report

- mode: changed
- files_scanned: 424
- funcs_scanned: 3805
- issues: 27
- blocking: 0

| Severity | Kind | Value | Threshold | Profile | Path | Symbol | Changed | Suggestion |
|---|---|---:|---:|---|---|---|---|---|
| warn | function | 201 | 134 | source | `src/app-auth/token-manager.ts` | createTokenManager | no | 把协议映射、状态计算、DOM 处理和 registry 分组拆成具名 helper。 |
| warn | function | 303 | 291 | composable | `src/components/chat/composables/useChatSSE.ts` | startStream | no | Composable 长函数优先拆 state model、event handlers、request lifecycle 和 cleanup helper。 |
| warn | function | 345 | 291 | composable | `src/components/chat/composables/useChatSSE.ts` | useChatSSE | no | Composable 长函数优先拆 state model、event handlers、request lifecycle 和 cleanup helper。 |
| warn | file | 831 | 504 | framework-component | `src/components/chat/RChatStreamRenderer.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| block | file | 1846 | 1344 | complex-component | `src/components/dashboard-builder/RDashboardBuilder.vue` |  | no | 复杂组件临时放宽；新增恶化必须抽 composable、子面板、adapter 或 renderer。 |
| warn | file | 562 | 504 | framework-component | `src/components/dashboard-builder/RDashboardWorkspace.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| block | file | 1111 | 840 | framework-component | `src/components/data-grid/RDataGrid.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 689 | 504 | framework-component | `src/components/data-table/RDataTable.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| block | file | 2102 | 1568 | docs-browser | `src/components/docs-browser/RDocsBrowser.vue` |  | no | Docs browser 属于复合工具；新增恶化必须拆 highlight、print、directory、content viewer 或 cache composable。 |
| warn | file | 698 | 504 | framework-component | `src/components/form-renderer/RFormRenderer.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 571 | 504 | framework-component | `src/components/image-crop-upload/RImageCropperDialog.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 803 | 504 | framework-component | `src/components/markdown-preview/RMarkdownPreview.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 709 | 504 | framework-component | `src/components/menu-preset-editor/RMenuPresetEditor.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 558 | 504 | composable | `src/components/pro-tree-editor/composables/useTreeData.ts` |  | no | Composable 可承担状态机和协议桥接；继续恶化时按状态、IO、副作用、校验和事件拆分。 |
| block | function | 467 | 459 | composable | `src/components/pro-tree-editor/composables/useTreeData.ts` | useTreeData | no | Composable 长函数优先拆 state model、event handlers、request lifecycle 和 cleanup helper。 |
| warn | file | 755 | 504 | framework-component | `src/components/pro-tree-editor/RProTreeEditor.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 535 | 504 | framework-component | `src/components/pro-tree-editor/RTreeNode.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 547 | 504 | framework-component | `src/components/pro-upload/RProUpload.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | function | 427 | 291 | composable | `src/components/pro-upload/useUploadCore.ts` | useUploadCore | no | Composable 长函数优先拆 state model、event handlers、request lifecycle 和 cleanup helper。 |
| warn | file | 546 | 504 | framework-component | `src/components/resource-picker/RResourcePickerDialog.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 598 | 504 | framework-component | `src/components/rich-text-editor/components/GridNodeView.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 684 | 504 | framework-component | `src/components/rich-text-editor/components/MenuBar.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 600 | 504 | framework-component | `src/components/rich-text-editor/RRichTextEditor.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| block | file | 1047 | 840 | framework-component | `src/components/settings-manager/RSettingsManager.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| warn | file | 679 | 504 | framework-component | `src/components/tree-select/RTreeSelect.vue` |  | no | 框架组件超过阈值后按 primitive、panel、composable、model、adapter 和样式职责拆分。 |
| block | file | 1604 | 1344 | complex-component | `src/components/workflow-designer/RWorkflowDesigner.vue` |  | no | 复杂组件临时放宽；新增恶化必须抽 composable、子面板、adapter 或 renderer。 |
| block | package | 59 | 48 | test | `tests/components` |  | no | 大目录只报告，不自动拆分；由人类决定是否按组件族、composable、adapter 或测试场景治理。 |
