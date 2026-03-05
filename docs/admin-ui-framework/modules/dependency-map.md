# 模块边界与依赖关系

## 模块依赖图

```
@rong/admin-ui
├── app-core (bootstrapApp, ErrorHandler)
│   └── 依赖: vue
├── app-plugin (PluginManager)
│   └── 依赖: vue
├── app-layout (LayoutProvider)
│   └── 依赖: vue
├── app-router (RouteGenerator, RouteLoader)
│   └── 依赖: vue, vue-router
├── app-permission (PermissionService, PermissionDirective)
│   └── 依赖: vue
├── app-request (HttpClient)
│   └── 依赖: (无外部依赖)
├── app-auth (TokenManager)
│   └── 依赖: BroadcastChannel API
├── app-config (ConfigProvider)
│   └── 依赖: vue
└── components/
    ├── data-table (RDataTable)
    │   └── 依赖: vue, naive-ui
    ├── form-renderer (RFormRenderer)
    │   └── 依赖: vue, naive-ui
    ├── modal-dialog (RModalDialog)
    │   └── 依赖: vue, naive-ui
    └── file-upload (RFileUpload)
        └── 依赖: vue, naive-ui
```

## 设计原则

- 框架模块（app-*）不依赖 naive-ui，纯 Vue 运行时
- 组件模块（components/*）依赖 naive-ui 作为 peer dependency
- 各模块间无交叉依赖，可独立使用
- 所有公共 API 通过根 index.ts 统一导出
