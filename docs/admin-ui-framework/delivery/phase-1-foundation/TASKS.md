# Phase 1 Foundation - 三级任务清单

## 1. 项目初始化
### 1.1 工程脚手架搭建
- [x] 1.1.1 创建 package.json（库模式，multi-entry exports）
- [x] 1.1.2 配置 tsconfig.json（strict + noImplicitAny + strictFunctionTypes）
- [x] 1.1.3 配置 vite.config.ts（lib 模式 + dts 生成）
- [x] 1.1.4 配置 vitest.config.ts（happy-dom + 覆盖率）
### 1.2 代码质量工具链
- [x] 1.2.1 配置 ESLint（no-explicit-any: error）
- [x] 1.2.2 配置 Prettier
- [x] 1.2.3 创建 .gitignore

## 2. app-core 模块
### 2.1 Contract 定义
- [x] 2.1.1 定义 AppBootstrapConfig 接口
- [x] 2.1.2 定义 AppPlugin 接口
- [x] 2.1.3 定义 AppErrorHandler 接口
- [x] 2.1.4 定义 AppContext 接口
### 2.2 实现
- [x] 2.2.1 实现 bootstrapApp 函数（插件排序安装 + 错误处理 + 挂载）
- [x] 2.2.2 实现 createErrorHandler 工厂（Vue/Promise/Global 三级）
### 2.3 测试
- [x] 2.3.1 bootstrap 挂载测试
- [x] 2.3.2 插件排序安装测试
- [x] 2.3.3 onReady 回调测试
- [x] 2.3.4 错误处理格式测试

## 3. app-plugin 模块
### 3.1 Contract 定义
- [x] 3.1.1 定义 UILibraryAdapter 接口
- [x] 3.1.2 定义 DiscreteApiProvider 及子接口（Message/Dialog/Notification/LoadingBar）
- [x] 3.1.3 定义 DirectiveDefinition 接口
### 3.2 实现
- [x] 3.2.1 实现 createPluginManager 工厂
- [x] 3.2.2 实现 getDiscreteApi 单例访问

## 4. app-layout 模块
### 4.1 Contract 定义
- [x] 4.1.1 定义 LayoutConfig / NavMode / PageAnimateType
- [x] 4.1.2 定义 LayoutSlots / MenuItem / BreadcrumbItem
### 4.2 实现
- [x] 4.2.1 实现 createLayoutProvider（reactive + provide/inject）
- [x] 4.2.2 实现 useLayout composable

## 5. app-router 模块
### 5.1 Contract 定义
- [x] 5.1.1 定义 RouteModuleConfig / RouteMeta
- [x] 5.1.2 定义 MenuDataItem / RouteGeneratorOptions
- [x] 5.1.3 定义 RouterSetupConfig / RouterGuardHooks / RouterContext
### 5.2 实现
- [x] 5.2.1 实现 loadRouteModules（glob 加载 + 排序）
- [x] 5.2.2 实现 createRouteGenerator（菜单→路由递归转换）
### 5.3 测试
- [x] 5.3.1 路由加载排序测试
- [x] 5.3.2 无效模块过滤测试
- [x] 5.3.3 嵌套子路由测试

## 6. app-permission 模块
### 6.1 Contract 定义
- [x] 6.1.1 定义 PermissionPolicy / PermissionItem / PermissionGroup
- [x] 6.1.2 定义 PermissionDirectiveBinding / PermissionEffect
### 6.2 实现
- [x] 6.2.1 实现 createPermissionService
- [x] 6.2.2 实现 createPermissionDirective
### 6.3 测试
- [x] 6.3.1 单权限 / 任意权限 / 全部权限检查
- [x] 6.3.2 超级管理员绕过
- [x] 6.3.3 清除权限

## 7. app-request 模块
### 7.1 Contract 定义
- [x] 7.1.1 定义 HttpClient / RequestConfig / RequestOptions
- [x] 7.1.2 定义 ApiResponse / RequestInterceptor / RequestError
- [x] 7.1.3 定义 TokenProvider / ErrorStrategyConfig
### 7.2 实现
- [x] 7.2.1 实现 createHttpClient（fetch + 拦截器 + token + 超时）
### 7.3 测试
- [x] 7.3.1 GET/POST 请求测试
- [x] 7.3.2 Authorization header 注入测试
- [x] 7.3.3 网络错误拦截测试

## 8. app-auth 模块
### 8.1 Contract 定义
- [x] 8.1.1 定义 TokenPair / TokenStorage / AuthConfig
- [x] 8.1.2 定义 TokenManagerInstance
### 8.2 实现
- [x] 8.2.1 实现 createTokenManager（存储 + 自动刷新 + 跨 tab 同步）
### 8.3 测试
- [x] 8.3.1 登录/登出 token 存储测试
- [x] 8.3.2 自动刷新测试
- [x] 8.3.3 刷新失败回调测试

## 9. app-config 模块
### 9.1 Contract 定义
- [x] 9.1.1 定义 DesignConfig / ProjectConfig / RuntimeConfig / WebsiteConfig
- [x] 9.1.2 定义 ConfigStore<T> 泛型
### 9.2 实现
- [x] 9.2.1 实现 createAppConfig（reactive + provide/inject）
- [x] 9.2.2 实现 useAppConfig composable

## 10. 质量门禁
### 10.1 门禁脚本
- [x] 10.1.1 创建 quality-gate.sh 脚本
- [x] 10.1.2 执行并通过所有硬门禁
### 10.2 文档
- [x] 10.2.1 生成设计文档
- [x] 10.2.2 生成任务清单
- [x] 10.2.3 生成门禁报告
