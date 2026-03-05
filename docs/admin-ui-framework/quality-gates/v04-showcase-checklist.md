# v0.4 Showcase Layout Checklist

> 校验 Story 展示页结构与版式质量

---

## 六区块结构检查

| 区块 | 要求 | QueryTableStory | CrudFormDialogStory |
|------|------|-----------------|---------------------|
| **Header** | 标题 + 描述 + import 提示 | RShowcaseLayout ✅ | RShowcaseLayout ✅ |
| **Demo 1** | 完整案例（搜索+工具栏+表格） | RDemoSection ✅ | RDemoSection（三种模式） ✅ |
| **Demo 2** | 变体案例（无搜索 / 最近操作） | RDemoSection ✅ | RDemoSection（conditional） ✅ |
| **API 区** | Expose API 交互按钮 | RDemoSection ✅ | — （通过按钮交互） |
| **Props 区** | 属性表格 | RPropsTable ✅ | RPropsTable ✅ |
| **Footer** | 质量面板 / 版本 | version badge ✅ | version badge ✅ |

---

## 版式质量

| 检查项 | 标准 | 结果 |
|--------|------|------|
| 最大宽度 | 960px | ✅ (RShowcaseLayout max-width) |
| 卡片层级 | Card → Section → Preview | ✅ (RDemoSection 三层嵌套) |
| 信息密度 | 标题 14px + 正文 13px + 代码 12px | ✅ |
| 折叠能力 | RDemoSection 支持 collapsed | ✅ |
| 键盘可达 | Toggle button focus-visible | ✅ |
| 响应式 | 内容自适应（overflow-x: auto） | ✅ (RPropsTable wrap) |
| data-testid | 所有展示组件有 testid | ✅ (showcase-layout, demo-section, props-table, quality-panel) |

---

## 评分

| 维度 | 分数 (0-100) |
|------|-------------|
| 结构完整性 | 90 |
| 版式一致性 | 85 |
| 交互丰富度 | 85 |
| a11y 可达性 | 80 |
| **加权总分** | **85** |
