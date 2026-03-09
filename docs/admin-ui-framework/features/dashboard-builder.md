# Dashboard Builder & Workspace

## 分层定位

- `rong-admin-ui`：沉淀通用能力（布局引擎、多 Dashboard 管理、导入导出、Widget 协议、Widget 编辑器容器）。
- `rong-admin-web`：提供业务适配器实现（当前 localStorage，未来替换后端 API）与业务 Widget 注册。

## 框架层能力

`RDashboardBuilder`（页面编排内核）：

- 网格布局（x/y/w/h）
- 拖拽、水平/垂直/双向缩放
- 碰撞重排 + 占位预览 + 对齐引导线
- 断点布局（lg/md/sm）
- 撤销/重做
- Widget 编辑器挂载能力（renderer + editor）

`RDashboardWorkspace`（多仪表盘管理容器）：

- Dashboard 切换（tab）
- 新建空白 Dashboard
- 删除 Dashboard
- 导出 JSON
- 导入 JSON

## Adapter 预留口（未来后端）

当前由 `DashboardWorkspaceAdapter` 对接存储层。未来接后端时，只替换 adapter 实现，不改 UI 框架组件。

```ts
interface DashboardWorkspaceAdapter {
  listDashboards: () => Promise<DashboardDefinition[]>
  createDashboard: (input: { name: string; description?: string }) => Promise<DashboardDefinition>
  deleteDashboard: (dashboardId: string) => Promise<void>
  loadLayout: (dashboardId: string) => Promise<DashboardLayoutItem[]>
  saveLayout: (dashboardId: string, layout: DashboardLayoutItem[]) => Promise<void>
  listWidgets: () => Promise<DashboardWidgetDefinition[]>
}
```

## Widget 开发规范（框架契约）

Widget 统一走“渲染器 + 编辑器”模式：

- `renderer`：负责展示和交互
- `editor`：负责编辑 `config`
- `definition`：提供默认尺寸、标题、描述、`editorOptions`

注册协议：

```ts
interface DashboardWidgetRegistryEntry {
  renderer: Component
  editor?: Component
}
```

推荐要求：

1. `config` 必须可序列化（可导入导出）。
2. Widget 必须支持 `title/description` 覆盖。
3. editor 只输出 `update:modelValue`，不直接操作布局。
4. 业务路由、权限、数据请求由 Web 层注入，不写死在 UI 组件。

## 第一批 Widget

首批保留并规范化的 Widget：

- `route-quick-actions`
  - 商业化快捷按钮组
  - 支持按钮编排
  - 支持路由下拉选择
  - 支持编辑 title/description
