# RRouteButton

`RRouteButton` 是中立的路由按钮原语：页面 CTA 用真实 `<a href>` 承载应用内导航，普通左键 SPA 跳转，Ctrl/Cmd+点击、中键、右键"新标签打开"和复制链接保持浏览器原生行为。

## 定位

- 仅做应用内路由导航（`vue-router` `RouteLocationRaw`），不承载业务字段、权限判断或业务文案。
- 渲染为 `tag="a"` 的 `NButton`，视觉与普通按钮完全一致。
- `target="_blank"` 自动补安全 `rel`（`noopener noreferrer`，统一由 `navigation/link-rel` 决定）。
- 不替代命令按钮：保存、删除、重试等流程动作继续使用 `NButton`。
- 不提供 `openInNewTab`/修饰键检测等 JS 模拟；导航语义完全来自真实 anchor。

## 文件

- 组件：`src/components/route-button/RRouteButton.vue`
- 契约：`src/components/route-button/types.ts`
- 导出：`src/components/route-button/index.ts`
- 链接安全默认值：`src/components/navigation/link-rel.ts`
- 测试：`tests/components/route-button.test.ts`

## 基础用法

```vue
<RRouteButton :to="{ name: 'UserCreate' }" type="primary">新建用户</RRouteButton>

<!-- 始终新标签打开 -->
<RRouteButton :to="`/users/${row.id}`" target="_blank">新标签查看</RRouteButton>

<!-- 依赖选中态：禁用时输出普通按钮，无 href -->
<RRouteButton :to="detailTarget" :disabled="!selected">查看详情</RRouteButton>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `to` | `RouteLocationRaw` | 必填 | 目标路由；URL 由 vue-router 解析，禁止调用方手拼 base/query |
| `target` | `'_self' \| '_blank'` | `'_self'` | `_blank` 时自动补安全 rel |
| `replace` | `boolean` | `false` | 导航是否替换历史记录 |
| `disabled` | `boolean` | `false` | 禁用时渲染无 `href` 的按钮 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `navigate` | 无 | 导航激活通知；导航本身由 RouterLink 承担，消费方不得再 `router.push` |

其余 attrs（`type`、`size`、`ghost`、`secondary` 等）透传到 `NButton`；默认插槽即按钮内容。

## 设计约束

- 消费方必须在 `vue-router` 上下文内使用。
- 通知事件 `navigate` 只用于埋点/状态同步；在事件里再调用 `router.push` 会造成双导航。
- 页面业务 route 的构造留在页面/VM；组件不理解业务路径。
