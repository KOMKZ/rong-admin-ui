# v0.4 Tasks — 平台化迭代

> 目标：应用层去轮子化

---

## 任务清单

| # | 任务 | 分类 | 优先级 | 状态 | 验收标准 |
|---|------|------|--------|------|----------|
| 1 | createRongAdminApp preset 实现 | Framework | P0 | ✅ DONE | web main.ts 使用 preset 启动, 6 测试通过 |
| 2 | RShowcaseLayout 展示组件 | UI | P0 | ✅ DONE | data-testid, CSS 变量, 6 区块结构 |
| 3 | RDemoSection 展示组件 | UI | P0 | ✅ DONE | 折叠/展开, focus-visible, a11y |
| 4 | RPropsTable 展示组件 | UI | P0 | ✅ DONE | 属性表格渲染, 必填/可选 badge |
| 5 | RQualityPanel 展示组件 | UI | P0 | ✅ DONE | pass/fail/warn/skip 状态图标 |
| 6 | RQueryTable 组合件 | Components | P1 | ✅ DONE | 搜索+表格+分页+选择+排序 |
| 7 | RCrudFormDialog 组合件 | Components | P1 | ✅ DONE | create/edit/view 三态, 表单验证 |
| 8 | Primitives 重导出 | Components | P0 | ✅ DONE | NButton/NSpace 等可从 @rong/admin-ui 导入 |
| 9 | web 消费 dist 产物 | Packaging | P0 | ✅ DONE | 三处 alias 移除, file: 协议依赖 |
| 10 | web ESLint no-restricted-imports | Governance | P0 | ✅ DONE | 业务代码 0 naive-ui 直引 |
| 11 | E2E data-testid 断言 | Governance | P0 | ✅ DONE | 所有 E2E 使用 getByTestId/getByRole |
| 12 | UserManagement 真实页面 | Consumption | P1 | ✅ DONE | RQueryTable + RCrudFormDialog 实际使用 |
| 13 | QueryTableStory 展示 | Consumption | P1 | ✅ DONE | 完整交互 + RPropsTable |
| 14 | CrudFormDialogStory 展示 | Consumption | P1 | ✅ DONE | 三种模式 + RPropsTable |
| 15 | web build chunk 优化 | Packaging | P1 | ✅ DONE | manualChunks 分割, 无 500K warning |
| 16 | 文档输出 | Docs | P1 | ✅ DONE | gate-report + consumption-map + checklist + visual-polish |

---

## 未完成 / v0.5 backlog

| 任务 | 说明 |
|------|------|
| RQualityPanel web 接入 | 展示组件已 export，待 web 门禁页面使用 |
| DataTableColumn render 支持 | 组合件操作列需要 render function |
| Dark mode token | 展示组件 CSS 变量需 dark mode 覆盖层 |
| Primitives 全量覆盖 | 仅导出 8 个常用组件，按需扩展 |
| Coverage threshold 门禁 | 需配置 vitest coverage 并设硬门禁 |
