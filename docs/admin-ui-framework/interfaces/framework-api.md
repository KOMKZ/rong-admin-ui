# 框架接口定义

## app-core

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| bootstrapApp(config) | app-core/bootstrap.ts | 应用引导入口 |
| createErrorHandler(config) | app-core/error-boundary.ts | 全局错误处理 |
| BootstrapConfig | app-core/types.ts | 引导配置 |
| ErrorHandlerConfig | app-core/types.ts | 错误处理配置 |

## app-auth

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| createTokenManager(config) | app-auth/token-manager.ts | 认证管理器（含 cross-tab sync） |
| AuthConfig | app-auth/types.ts | 认证配置 |
| TokenPair | app-auth/types.ts | Token 对 |
| TokenStorage | app-auth/types.ts | 存储适配器接口 |
| TokenManagerInstance | app-auth/types.ts | Manager 实例方法 |

## app-request

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| createHttpClient(config) | app-request/http-client.ts | HTTP 客户端 |
| HttpClientConfig | app-request/types.ts | 客户端配置 |

## app-permission

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| createPermissionService() | app-permission/permission-service.ts | 权限服务 |
| createPermissionDirective(service) | app-permission/permission-directive.ts | v-permission 指令 |

## app-router

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| createRouteGenerator(config) | app-router/route-generator.ts | 动态路由生成器 |
| loadRouteModules(modules) | app-router/route-loader.ts | 路由模块加载器 |

## app-config

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| installAppConfig(app, config) | app-config/config-provider.ts | 配置注入插件 |

## app-plugin

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| createPluginManager() | app-plugin/plugin-manager.ts | 插件管理器 |
| AppPlugin | app-plugin/types.ts | 插件接口定义 |

## app-layout

| 接口/函数 | 路径 | 说明 |
|----------|------|------|
| createLayoutProvider(config) | app-layout/layout-provider.ts | 布局提供者 |
