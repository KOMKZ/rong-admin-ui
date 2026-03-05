# 如何新增组件并接入治理

## 1. 创建组件目录

```
src/components/<component-name>/
├── R<ComponentName>.vue    # 组件实现
├── types.ts                # TypeScript 类型契约
└── index.ts                # 公共导出
```

## 2. 定义类型契约 (types.ts)

```typescript
export interface ComponentNameProps {
  // props 定义
}
export interface ComponentNameEmits {
  // emit 事件定义
}
export interface ComponentNameExpose {
  // expose 方法定义
}
```

## 3. 实现组件 (R<ComponentName>.vue)

- 所有颜色从 `--ra-*` 语义 token 读取
- 添加 `data-testid` 用于 E2E 测试
- 键盘可达，语义标签
- Props 使用 `defineProps` + `PropType`
- 显式定义 `defineEmits` 和 `defineExpose`

## 4. 注册导出

在 `src/components/index.ts` 添加 re-export：
```typescript
export * from './<component-name>'
```

如需子入口，在 `package.json` exports 和 `vite.config.ts` lib entry 中添加。

## 5. 在 rong-admin-web 中验证

- 创建至少 1 个真实业务使用场景
- 创建 Story 页面用于独立演示
- 不得直接 import naive-ui（使用 primitives 重导出）

## 6. 接入质量门禁

1. `npm run typecheck` — 类型安全
2. `npm run lint` — 代码规范
3. `npm run test` — 单元测试
4. `npm run build` — 构建
5. `npm run gate:contract` — 契约完整性
6. `npm run gate:api` — API 报告更新
7. `npx changeset` — 创建变更记录

## 7. E2E 覆盖

在 `rong-admin-web/e2e/` 添加组件的 E2E 测试：
- 使用 `data-testid` 选择器
- 覆盖基础渲染 + 交互 + a11y
- 禁止依赖易变文案
