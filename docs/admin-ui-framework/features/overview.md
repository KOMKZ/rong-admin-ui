# @rong/admin-ui — 能力概览

## 解决什么问题

为后台管理系统提供统一的框架底座和标准化组件，避免业务项目重复造轮子。

## 核心能力

| 能力 | 模块 | 状态 |
|------|------|------|
| 应用引导 | app-core (bootstrapApp, ErrorHandler) | ✅ 已实现 |
| 插件系统 | app-plugin (PluginManager) | ✅ 已实现 |
| 布局系统 | app-layout (LayoutProvider) | ✅ 已实现 |
| 路由生成 | app-router (RouteGenerator, RouteLoader) | ✅ 已实现 |
| 权限控制 | app-permission (PermissionService, v-permission) | ✅ 已实现 |
| HTTP 请求 | app-request (HttpClient) | ✅ 已实现 |
| 认证管理 | app-auth (TokenManager, cross-tab sync) | ✅ 已实现 |
| 配置注入 | app-config (ConfigProvider) | ✅ 已实现 |
| 数据表格 | components/data-table (RDataTable) | ✅ 已实现 |
| 表单引擎 | components/form-renderer (RFormRenderer) | ✅ 已实现 |
| 对话框 | components/modal-dialog (RModalDialog) | ✅ 已实现 |
| 文件上传 | components/file-upload (RFileUpload) | ✅ 已实现 |
| 树编辑器 | components/pro-tree-editor (RProTreeEditor) | ✅ 已实现 |

## 技术栈

- Vue 3.4+ / TypeScript 5.6+
- Naive UI 2.38+ (组件层 peer dependency)
- Pinia 2.0+ / Vue Router 4.0+
- Vitest + axe-core (测试与 a11y)

## 消费方式

```ts
// 框架能力
import { bootstrapApp, createTokenManager, createHttpClient } from '@rong/admin-ui'

// 组件
import { RDataTable, RFormRenderer, RModalDialog, RFileUpload } from '@rong/admin-ui'
import { RProTreeEditor, createArticleFolderAdapter } from '@rong/admin-ui/components/pro-tree-editor'
```
