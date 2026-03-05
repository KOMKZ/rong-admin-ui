# Phase 2 组件能力标准化 — 设计文档

## 1. 背景与目标

Phase 1 建立了 8 个核心框架模块的契约与实现。Phase 2 聚焦于：

1. 建立统一组件协议模板（props/emits/slots/states/a11y/perf/testing）
2. 从 staff-portal 提取公共组件规格（DataTable / FormRenderer / ModalDialog / FileUpload）
3. 补充核心链路集成测试（Bootstrap → Router → Permission）
4. 启用覆盖率硬门禁（lines >= 85%, branches >= 70%）
5. 在 rong-admin-web 初始化项目并接入框架验证
6. 建立组件可视化 Story 演示页

## 2. 核心原则

- **先协议后实现**：组件先定义类型契约（types.ts），再开发实现
- **契约驱动 Story**：Story 页面基于契约展示，不依赖未实现的组件
- **框架仓库纯净**：Story/Demo 放在消费方（rong-admin-web），不污染框架仓库
- **web-consumption 硬门禁**：框架每新增能力必须在 rong-admin-web 有调用证据

## 3. 组件标准协议

每个公共组件必须定义：

- `Props`：类型、默认值、边界值、必填标记
- `Emits`：事件名称、触发时机、Payload 类型
- `Slots`：结构、可选性、回退行为
- 状态集合：loading / empty / error / disabled
- 可访问性：键盘导航路径、ARIA 语义、对比度要求
- 性能预算：首屏渲染、交互响应、重渲染阈值

## 4. 组件分层

| 层级 | 定位 | 示例 |
|------|------|------|
| base | 原子组件 | Button, Input, Tag |
| business-neutral | 中台组件 | DataTable, FormRenderer, ModalDialog, FileUpload |
| composed-pattern | 复合模板 | CrudPage, DetailPage, BatchAction |

## 5. 本轮提取的 4 个组件规格

| 组件 | 类型文件 | 规格文档 |
|------|----------|----------|
| DataTable | `src/components/data-table/types.ts` | `data-table-spec.md` |
| FormRenderer | `src/components/form-renderer/types.ts` | `form-renderer-spec.md` |
| ModalDialog | `src/components/modal-dialog/types.ts` | - |
| FileUpload | `src/components/file-upload/types.ts` | - |

## 6. rong-admin-web 接入验证

- 项目已初始化（Vue 3 + TypeScript + Vite）
- 通过 path alias 引用 `@rong/admin-ui`
- FrameworkDemo 页面验证 Auth / Permission / HttpClient / Component Contracts
- Story 页面验证 DataTable / FormRenderer / ModalDialog / FileUpload 契约
- TypeCheck 全量通过
