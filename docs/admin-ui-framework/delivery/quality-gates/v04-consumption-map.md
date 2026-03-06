# v0.4 Consumption Map

> UI 框架每项能力在 rong-admin-webdemo 中的消费证据

---

## Framework 层

| 能力 | 消费点 | 文件 |
|------|--------|------|
| `createRongAdminApp` | 应用启动 | `src/main.ts` |
| `installAppConfig` | 通过 preset 自动 | `src/main.ts` |
| `createTokenManager` | 通过 preset 自动 | `src/main.ts` |
| `createPermissionService` | 通过 preset 自动 | `src/main.ts` |
| `createHttpClient` | 通过 preset 自动 | `src/main.ts` |
| `createPluginManager` | 通过 preset 自动 | `src/main.ts` |
| `v-permission` directive | 通过 preset 自动注册 | `src/main.ts` |

## 基础组件层

| 组件 | 消费点 | 文件 |
|------|--------|------|
| `RDataTable` | Story + FrameworkDemo | `stories/DataTableStory.vue`, `views/FrameworkDemo.vue` |
| `RFormRenderer` | Story + FrameworkDemo + UserMgmt CRUD | `stories/FormRendererStory.vue`, `views/UserManagement.vue` |
| `RModalDialog` | Story + FrameworkDemo | `stories/ModalDialogStory.vue`, `views/FrameworkDemo.vue` |
| `RFileUpload` | Story + FrameworkDemo | `stories/FileUploadStory.vue`, `views/FrameworkDemo.vue` |

## 展示组件层

| 组件 | 消费点 | 文件 |
|------|--------|------|
| `RShowcaseLayout` | QueryTable + CrudFormDialog Story | `stories/QueryTableStory.vue`, `stories/CrudFormDialogStory.vue` |
| `RDemoSection` | QueryTable + CrudFormDialog Story | `stories/QueryTableStory.vue`, `stories/CrudFormDialogStory.vue` |
| `RPropsTable` | QueryTable + CrudFormDialog Story | `stories/QueryTableStory.vue`, `stories/CrudFormDialogStory.vue` |
| `RQualityPanel` | — (可用于门禁展示页) | 已 export，待接入 |

## 组合件层

| 组件 | 消费点 | 文件 |
|------|--------|------|
| `RQueryTable` | Story + UserManagement 真实页面 | `stories/QueryTableStory.vue`, `views/UserManagement.vue` |
| `RCrudFormDialog` | Story + UserManagement 真实页面 | `stories/CrudFormDialogStory.vue`, `views/UserManagement.vue` |

## Primitives 重导出

| 组件 | 消费点 | 文件 |
|------|--------|------|
| `NButton` (via @rong/admin-ui) | UserManagement | `views/UserManagement.vue` |
| `NSpace` (via @rong/admin-ui) | UserManagement | `views/UserManagement.vue` |

---

## 消费密度统计

| 分类 | 总能力数 | web 已消费 | 覆盖率 |
|------|----------|-----------|--------|
| Framework API | 7 | 7 | 100% |
| 基础组件 | 4 | 4 | 100% |
| 展示组件 | 4 | 3 | 75% |
| 组合件 | 2 | 2 | 100% |
| Primitives | 8 | 2 | 25% |
| **总计** | **25** | **18** | **72%** |
