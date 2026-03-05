# Phase 1 基础框架设计文档

- 版本：v0.1
- 日期：2026-03-04
- 状态：Initial Release

## 1. 背景与目标

将 staff-portal 中散落的框架级代码抽象为可复用、可测试、类型安全的 Admin UI 框架底座，使多个后台应用可以共享同一套基础架构。

### 1.1 核心原则

- **Contract-First**：先定义 TypeScript 接口/类型，再实现
- **Zero Any**：ESLint 强制 `no-explicit-any`，tsconfig 开启 `noImplicitAny`
- **Injection over Global**：依赖注入替代 `window.*` 全局变量
- **Composable Pattern**：Vue 3 组合式 API + provide/inject

## 2. 基线分析结论

### 2.1 源项目（staff-portal）能力地图

| 模块 | 可复用资产 | 风险项 | 抽象建议 |
|------|-----------|--------|----------|
| Bootstrap | 初始化顺序、错误处理流程 | errorHandler any | createApp 工厂 + 插件编排 |
| Router | glob 路由加载、排序、动态路由 | sortRoute/generator 无类型 | RouteContract + RouteLoader + RouteGenerator |
| Guards | 认证流程、动态路由注入 | window.$loading 全局依赖 | createAuthGuards(options) 注入式 |
| Permission | hasPermission/hasAny/hasAll、v-permission | binding.value 无类型 | PermissionPolicy + PermissionDirective |
| Request | Alova HTTP 封装 + token 注入 | res/error any、window 依赖 | createHttpClient(config) 工厂 |
| Auth | Token 刷新 + 跨 tab 同步 | response any | createTokenManager(config) |
| Layout | 多导航模式、响应式 | 业务 class 耦合 | LayoutConfig provide/inject |
| Config | 设计/项目/运行时配置 | getter 返回 object | ConfigStore<T> 泛型 |

### 2.2 关键风险

1. `noImplicitAny: false` + `strictFunctionTypes: false` → 类型安全薄弱
2. `window.$loading` / `window.$message` / `window.$dialog` → 全局状态不可控
3. 路由 generator 参数全部 any → 运行时错误难追踪

## 3. 模块架构

```
@rong/admin-ui
├── app-core        → Bootstrap, Plugin 编排, Error Boundary
├── app-plugin      → UI 库适配器, 指令注册, Discrete API
├── app-layout      → 导航模式, 响应式, 动画
├── app-router      → 路由加载, 菜单→路由转换
├── app-permission  → 权限服务, 权限指令
├── app-request     → HTTP 客户端工厂, 拦截器, 错误策略
├── app-auth        → Token 管理, 自动刷新, 跨 tab 同步
└── app-config      → 设计/项目/运行时/网站配置
```

### 3.1 依赖方向

```
app-config ← app-layout ← app-core
                         ↗
app-plugin → app-core
app-router (standalone)
app-permission (standalone)
app-request ← app-auth
```

## 4. Contract 设计摘要

### 4.1 app-core
- `AppBootstrapConfig`：根组件 + 容器 + 插件列表 + 错误处理
- `AppPlugin`：name + install + order
- `AppErrorHandler`：Vue/Promise/Global 三级错误回调

### 4.2 app-plugin
- `UILibraryAdapter`：install + setupDiscreteApi
- `DiscreteApiProvider`：message/dialog/notification/loadingBar 抽象
- `DirectiveDefinition`：name + directive

### 4.3 app-layout
- `LayoutConfig`：navMode/sidebar/header/footer/tabs/animate
- `LayoutActions`：setNavMode/toggleSidebar/etc.
- `MenuItem`：key/label/icon/children/path/meta

### 4.4 app-router
- `RouteModuleConfig`：name/path/component/meta/order
- `MenuDataItem`：后端菜单数据结构
- `RouteGeneratorOptions`：layout/parentLayout/viewModules/notFound
- `RouterGuardHooks`：beforeAuth/afterAuth/onAuthFail

### 4.5 app-permission
- `PermissionPolicy`：hasPermission/hasAny/hasAll/isSuperAdmin
- `PermissionDirectiveBinding`：action + effect(disabled|hidden)

### 4.6 app-request
- `HttpClient`：request/get/post/put/patch/delete
- `RequestInterceptor`：onRequest/onResponse/onError
- `TokenProvider`：getToken/getTokenType
- `ErrorStrategyConfig`：default + codeMapping

### 4.7 app-auth
- `TokenPair`：accessToken/refreshToken/expiresIn
- `TokenStorage`：get/set/remove
- `TokenManagerInstance`：init/destroy/getToken/onLoginSuccess/onLogout

### 4.8 app-config
- `DesignConfig`：darkMode/primaryColor/borderRadius/fontSize
- `ProjectConfig`：title/navMode/permissionMode/tabs/animate
- `RuntimeConfig`：apiBaseURL/env/debug
- `WebsiteConfig`：title/logo/loginImage/copyright

## 5. 验收标准

- [x] 8 个模块边界图完整
- [x] 所有 Contract 有明确的 TypeScript 接口
- [x] TypeCheck 通过（vue-tsc --noEmit）
- [x] ESLint 0 warnings（no-explicit-any 开启）
- [x] 24 个单元测试全部通过
- [x] Prettier 格式一致
