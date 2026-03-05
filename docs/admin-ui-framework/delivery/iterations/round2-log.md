# Round-2 迭代日志：商业化组件扩展

> 日期: 2026-03-05
> 分支: feature/v0.6-modernization
> 对标基线: Ant Design Pro / ProComponents / Arco Pro

## 目标

围绕"列表 → 详情 → 编辑流程"主链路，补齐高频企业后台组件封装。

## 新增组件清单

| 组件 | 路径 | 能力摘要 | 单测 | Web 消费 |
|------|------|---------|------|---------|
| RFilterBarPro | `filter-bar/` | 基础筛选+高级折叠+快捷chips+保存方案(localStorage) | ✅ 12 tests | UserManagement |
| RTableToolbarPro | `table-toolbar/` | 刷新/导出/密度切换/全屏/列预设配置 | ✅ 14 tests | UserManagement |
| RDescriptionsPanel | `descriptions-panel/` | 分组/列数自适应/状态标签插槽/空值占位/可复制 | ✅ 13 tests | UserDetailPage |
| RProList | `pro-list/` | 卡片/列表双视图切换+操作区+空态+分页 | ✅ 14 tests | ProjectListPage |
| RStepForm | `step-form/` | 多步骤+逐步校验+上下步+完成态+回滚重置 | ✅ 16 tests | CreateUserWizard |
| RPageSkeleton | `page-skeleton/` | list/detail/form 三模式骨架屏 | ✅ 12 tests | UserManagement |
| RBatchActionBar | `batch-action-bar/` | 选中统计+批量操作+危险动作二次确认+ARIA | ✅ 12 tests | UserManagement |

## 消费方落地

| 页面 | 路由 | 使用组件 |
|------|------|---------|
| UserManagement (升级) | `/system/users` | RFilterBarPro + RTableToolbarPro + RBatchActionBar + RPageSkeleton |
| UserDetailPage (新增) | `/system/users/:id` | RDescriptionsPanel + RPageSkeleton + RPageHeader |
| ProjectListPage (新增) | `/projects` | RProList + RFilterBarPro + RPageHeader |
| CreateUserWizard (新增) | `/system/users/create` | RStepForm + RPageHeader + RResultState |

## Pre-Round-2 完成项

- file-upload 覆盖率提升: 新增 `file-upload-custom-request.test.ts` (32 个测试用例)
- Naive UI stub 模板: `tests/helpers/naive-stubs.ts` (70+ 组件映射)
- E2E 测试: `round2-components.spec.ts` (新增 16 个 E2E 场景)

## 门禁结果

| 门禁 | UI | Web |
|------|-----|-----|
| typecheck | ✅ | ✅ |
| lint | ✅ | ✅ |
| unit test | ✅ 568 passed | ✅ |
| build | ✅ | ✅ |

## Failure Patterns & CAPA

### FP-1: Naive UI 导入边界
- **现象**: 业务页面直接从 `naive-ui` 导入组件，触发 `no-restricted-imports` lint 错误
- **根因**: 新增页面使用了 NTimeline/NProgress 等未被 primitives 重导出的组件
- **纠正**: 在 `primitives/index.ts` 补充 NTimeline, NTimelineItem, NProgress, NSteps, NStep 等重导出
- **预防**: 新增页面引用 Naive UI 组件时，必须先确认 primitives 中已有重导出

### FP-2: 未构建 dist 导致 Web typecheck 失败
- **现象**: Web typecheck 无法识别新组件导出
- **根因**: `file:../rong-admin-ui` 引用解析到 dist 目录，新组件代码未编译
- **纠正**: 组件开发完成后必须先 `vite build` 再做 Web typecheck
- **预防**: 加入工作流：UI 代码改动 → build → Web typecheck 三步顺序执行

### FP-3: 筛选持久化方案
- **风险**: localStorage 筛选方案在多浏览器/设备间不同步
- **当前方案**: 仅本地持久化，适合单用户场景
- **后续**: 可考虑服务端 API 存储 + 用户维度隔离

## 技术决策

1. **RFilterBarPro** 基于现有 RFormRenderer 渲染筛选字段，避免重复造轮子
2. **RStepForm** 使用逐步校验 + Promise-based validate，支持异步后端校验
3. **RPageSkeleton** 纯 CSS 实现，不依赖 Naive UI 的 NSkeleton（更轻量、可控）
4. **RBatchActionBar** 支持 Transition 动画和 ARIA toolbar 语义
5. **RProList** grid 使用 CSS `auto-fill` + `minmax` 实现真正自适应列数
