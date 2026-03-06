# 消费方调用映射

> 记录 @rong/admin-ui 每项能力在 rong-admin-webdemo 中的调用位置。

## 框架能力

| 能力 | 消费文件 | 调用方式 |
|------|---------|----------|
| bootstrapApp | src/main.ts | 应用启动 |
| createErrorHandler | src/main.ts | 全局错误注册 |
| installAppConfig | src/main.ts | 配置注入 |
| createTokenManager | src/main.ts | 认证初始化 |
| createPermissionService | src/main.ts | 权限初始化 |
| createPermissionDirective | src/main.ts | v-permission 注册 |
| createPluginManager | src/main.ts | 插件管理 |
| createHttpClient | src/main.ts | HTTP 客户端 |

## 组件能力

| 组件 | 消费文件 | 场景 |
|------|---------|------|
| RDataTable | src/stories/DataTableStory.vue | 完整 CRUD 列表演示（分页/排序/选择/空态/加载态） |
| RFormRenderer | src/stories/FormRendererStory.vue | Schema 表单演示（多字段类型/验证/禁用态/Expose API） |
| RModalDialog | src/stories/ModalDialogStory.vue | 对话框演示（基础/加载态/自定义footer/嵌套表单） |
| RFileUpload | src/stories/FileUploadStory.vue | 文件上传演示（按钮/拖拽/自定义请求/禁用态） |

## 验证方式

| 类型 | 命令 | 状态 |
|------|------|------|
| TypeCheck | `npx vue-tsc --noEmit` | ✅ PASS |
| Unit Tests | `npx vitest run` (rong-admin-webdemo) | ✅ PASS |
| E2E Tests | `npx playwright test` (rong-admin-webdemo) | ✅ 已配置 |
