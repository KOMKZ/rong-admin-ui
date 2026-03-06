# Phase 2 组件能力标准化 — 任务清单

## 1. 阻断级缺陷修复（Phase 1 hardening）

- [x] 1.1 修复请求错误语义与取消机制
  - [x] 1.1.1 http-client 透传 HTTP 业务错误（kind=HTTP_ERROR + status）
  - [x] 1.1.2 合并 timeout + external signal（mergeSignals 工具函数）
  - [x] 1.1.3 补 401/403/500 + TIMEOUT + CANCELLED 单测
- [x] 1.2 修复认证刷新幂等与同步一致性
  - [x] 1.2.1 startAutoRefresh 幂等化（先 stop 再 start）
  - [x] 1.2.2 跨 Tab 事件语义对齐（login/token_refreshed/logout 全处理）
  - [x] 1.2.3 init 幂等保护（initialized 标记）
  - [x] 1.2.4 补 idempotent timer / repeated init 单测
- [x] 1.3 完善应用生命周期清理
  - [x] 1.3.1 destroy 解绑 unhandledrejection/error 监听器
  - [x] 1.3.2 destroy 幂等保护（destroyed 标记）
  - [x] 1.3.3 补 removeEventListener 验证 + 重复 destroy 单测

## 2. 契约对齐与测试增强

- [x] 2.1 修复路由 contract 偏差
  - [x] 2.1.1 route-generator 落地 notFoundComponent 兜底逻辑
  - [x] 2.1.2 叶子节点无 component / 无匹配 viewModule 均回退到 notFoundComponent
- [x] 2.2 增强路由生成器测试
  - [x] 2.2.1 新增 route-generator.test.ts（8 tests）
  - [x] 2.2.2 覆盖多层 children、redirect、缺省 component、meta 合并、空 menus
- [x] 2.3 强化质量门禁
  - [x] 2.3.1 安装 @vitest/coverage-v8
  - [x] 2.3.2 vitest.config.ts 启用 coverage provider + 阈值（lines >= 85%, branches >= 70%）
- [x] 2.4 补充缺失模块测试
  - [x] 2.4.1 layout-provider.test.ts（6 tests）
  - [x] 2.4.2 plugin-manager.test.ts（5 tests）
  - [x] 2.4.3 permission-directive.test.ts（4 tests）
  - [x] 2.4.4 config-provider.test.ts（5 tests）

## 3. 组件协议标准化

- [x] 3.1 建立组件类型契约
  - [x] 3.1.1 DataTable types.ts（Props/Emits/Slots/Expose/Action）
  - [x] 3.1.2 FormRenderer types.ts（Schema/Props/Emits/Slots/Expose）
  - [x] 3.1.3 ModalDialog types.ts（Props/Emits/Slots/Expose）
  - [x] 3.1.4 FileUpload types.ts（Props/Emits/Slots/Expose/File 状态机）
- [x] 3.2 生成组件规格文档
  - [x] 3.2.1 data-table-spec.md
  - [x] 3.2.2 form-renderer-spec.md

## 4. 集成测试

- [x] 4.1 Bootstrap → Config → Auth → Permission → Route 链路
  - [x] 4.1.1 core-pipeline.test.ts（2 tests）
  - [x] 4.1.2 验证完整登录 → 设置权限 → 生成路由 → 渲染流程
  - [x] 4.1.3 验证完整登出 → 清除权限 → 销毁流程

## 5. rong-admin-webdemo 接入

- [x] 5.1 项目初始化
  - [x] 5.1.1 package.json + tsconfig.json + vite.config.ts
  - [x] 5.1.2 path alias 配置 @rong/admin-ui
- [x] 5.2 框架验证页面
  - [x] 5.2.1 main.ts 接入 bootstrap/auth/permission/httpClient
  - [x] 5.2.2 FrameworkDemo.vue 验证全模块协作
- [x] 5.3 Story 演示页
  - [x] 5.3.1 StoryApp.vue 导航骨架
  - [x] 5.3.2 FrameworkStory / DataTableStory / FormRendererStory / ModalDialogStory / FileUploadStory

## 6. 质量门禁

- [x] 6.1 TypeCheck（vue-tsc --noEmit）: PASS
- [x] 6.2 ESLint: PASS
- [x] 6.3 Prettier: PASS
- [x] 6.4 Unit Tests: 68/68 PASS
- [x] 6.5 Coverage: lines=92.56%, branches=86.57% — 超过阈值
- [x] 6.6 web-consumption: rong-admin-webdemo TypeCheck PASS
