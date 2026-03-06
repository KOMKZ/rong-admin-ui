# Round-2 消费映射 (rong-admin-webdemo)

| 组件 | 消费页面 | 路由 | 接入方式 |
|------|---------|------|---------|
| RFilterBarPro | UserManagement.vue | `/system/users` | 顶部筛选区，替代原 RQueryTable 内置搜索 |
| RFilterBarPro | ProjectListPage.vue | `/projects` | 项目列表筛选 |
| RTableToolbarPro | UserManagement.vue | `/system/users` | 表格上方工具栏 |
| RDescriptionsPanel | UserDetailPage.vue | `/system/users/:id` | 用户详情信息展示 |
| RProList | ProjectListPage.vue | `/projects` | 卡片/列表双视图项目展示 |
| RStepForm | CreateUserWizard.vue | `/system/users/create` | 分步创建用户流程 |
| RPageSkeleton | UserManagement.vue | `/system/users` | 首次加载骨架屏 |
| RBatchActionBar | UserManagement.vue | `/system/users` | 多选后批量操作栏 |
| RPageHeader | UserDetailPage.vue | `/system/users/:id` | 详情页头部 |
| RPageHeader | ProjectListPage.vue | `/projects` | 列表页头部 |
| RPageHeader | CreateUserWizard.vue | `/system/users/create` | 向导页头部 |
| RResultState | CreateUserWizard.vue | `/system/users/create` | 创建成功结果页 |

## 路由变更

新增路由（`src/router/routes.ts`）:
- `/system/users/:id` — UserDetail（用户详情）
- `/system/users/create` — CreateUser（创建用户向导）
- `/projects` — ProjectList（项目列表）

## 依赖关系

```
UserManagement
├── RFilterBarPro
├── RTableToolbarPro
├── RQueryTable
├── RBatchActionBar
├── RPageSkeleton
└── RCrudFormDialog

UserDetailPage
├── RPageHeader
├── RDescriptionsPanel
└── RPageSkeleton

ProjectListPage
├── RPageHeader
├── RFilterBarPro
└── RProList

CreateUserWizard
├── RPageHeader
├── RStepForm
└── RResultState
```
