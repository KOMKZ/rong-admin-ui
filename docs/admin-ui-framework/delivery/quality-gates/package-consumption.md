# @rong/admin-ui 共享包消费闭环

## 适用范围

适用于通过 `@rong/admin-ui` 消费共享组件的 Web 项目，尤其是当前使用
`link:../rong-admin-ui` 的 `hrise-admin-web`。

## 关键事实

消费方依赖 `package.json` 的 `exports`，运行时入口是 `dist`。即使依赖通过本地
link 指向共享仓库，修改 `src` 也不会自动生成新的运行时代码。

因此，出现“源码已经修改，但页面行为没有变化”时，优先检查构建产物和真实解析路径，
不要在消费页面复制一份临时逻辑。

## 标准闭环

```bash
# 1. 在共享包仓库
cd ../rong-admin-ui
npm run typecheck
npm run test -- --run <相关测试文件>
npm run build

# 2. 在消费方确认真实包路径和消费方质量
cd ../hrise-admin-web
node -p "require.resolve('@rong/admin-ui/package.json')"
npm run typecheck
# 按任务需要执行 npm run build 或真实页面冒烟
```

如果消费方 dev server 已经运行，重新构建共享包后需要重启 dev server；浏览器侧必要时执行
强制刷新，避免 Vite 依赖预构建缓存继续使用旧 bundle。

## 禁止事项

- 只修改 `rong-admin-ui/src`，不执行 `npm run build`。
- 只验证消费方 `typecheck`，就认为共享组件运行时已更新。
- 在消费方通过 `../rong-admin-ui/src` 绕过 package exports。
- 为验证方便把公共组件逻辑复制到业务页面。

## 回归证据

公共组件变更至少保留：共享包测试、共享包 build、消费方 typecheck/build，以及真实消费页面
的关键交互验证。上传、预览、媒体回填等能力还要核对浏览器 Network 中的实际请求字段，不能只看
TypeScript 类型声明。
