# Page Layout — 页面骨架协议

`page-layout` 是后台内容页的唯一布局入口，负责页面根间距、卡片边界、表格工具区和表单宽度。

## 组件

| 组件           | 场景          | 说明                                       |
| -------------- | ------------- | ------------------------------------------ |
| `RListPage`    | 列表 / 管理页 | 固定 `filters`、表格卡片、工具区、浮层插槽 |
| `RFormPage`    | 新建 / 编辑页 | 固定表单卡片和宽度档位                     |
| `RDetailPage`  | 详情页        | 固定详情页根容器                           |
| `RPageTabs`    | 一级页面 Tab  | 白色完整 Surface；内部放 `NTabs/NTabPane`  |
| `RSectionCard` | 普通内容分区  | 替代应用层 `n-card` / `.ra-card`           |
| `RPage`        | 特殊页面根    | 仅用于无法归类的内容页                     |

## 强制规则

- 应用 `src/views/**` 禁止直接写 `class="ra-page"`。
- 应用 `src/views/**` 禁止直接写 `class="ra-card"`。
- 应用 `src/views/**` 禁止直接使用 `<RTableCard>`；列表页必须使用 `RListPage`。
- 应用 `src/views/**` 禁止直接使用 `<n-card>`；内容分区必须使用 `RSectionCard`。
- 一级页面导航 Tab 必须使用 `RPageTabs`。禁止把 `NTabs` 直接放在 `RPage` 灰底上，也禁止为了页签样式在业务页面复制背景、边框和 padding。
- 表单模式、弹窗、卡片、诊断区和列表内部的局部 Tab 属于 Panel Tabs，不使用 `RPageTabs`。
- 详情页默认只保留业务内容分区；当 AdminLayout 顶部标题、面包屑或页签已经提供上下文时，禁止再生成“返回 / 标题 / 摘要 / 刷新”这类重复详情头部。
- 登录页和错误页是独立 shell，可不套后台内容页协议。

## 列表页标准

```vue
<RListPage data-testid="user-list-page" table-testid="user-card">
  <template #filters>
    <RFilterBarPro />
  </template>

  <template #extra>
    <!-- 主操作 -->
  </template>

  <RDataTable />

  <template #overlays>
    <!-- dialog / drawer -->
  </template>
</RListPage>
```

## 表单页标准

```vue
<RFormPage width="medium" data-testid="user-create-page" card-testid="user-create-card">
  <RFormRenderer />
</RFormPage>
```

宽度只能使用 `narrow`、`medium`、`wide`、`full`，不得在业务页覆盖 `.ra-card` 宽度。

## 详情页标准

```vue
<RDetailPage data-testid="user-detail-page">
  <RSectionCard>
    <!-- 详情内容 -->
  </RSectionCard>
</RDetailPage>
```

一级页面 Tab：

```vue
<RPage>
  <RPageTabs data-testid="resource-page-tabs">
    <NTabs v-model:value="activeTab" type="line">
      <NTabPane name="overview" tab="概览">...</NTabPane>
      <NTabPane name="records" tab="记录">...</NTabPane>
    </NTabs>
  </RPageTabs>
</RPage>
```

`RPageTabs` 只治理 Surface，不代理 `NTabs` API，不持有 active value，也不决定懒加载策略。这样页面导航的视觉统一，业务状态仍留在消费页。

只有存在真实业务流程入口时，才允许在详情页顶部增加操作区；操作区必须使用 `RSectionCard`，且不得重复页面标题、面包屑、返回、刷新等全局导航已覆盖的信息。

## 门禁

消费应用必须提供并执行：

```bash
pnpm run gate:layout
```
