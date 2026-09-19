# rong-admin-ui Agent 规则

## 共享包构建与消费边界

详细流程见 `docs/admin-ui-framework/delivery/quality-gates/package-consumption.md`。

- `hrise-admin-web` 通过 `@rong/admin-ui` 的 `package.json` `exports` 消费 `dist` 产物；修改 `src` 不会自动改变消费方运行时。
- 修改公共组件、公共类型、上传协议或导出入口后，必须在本仓库执行 `npm run build`，再到真实消费方执行 typecheck/build 或对应冒烟验证；只执行 `vue-tsc` 不算交付。
- 调试“源码已修改但消费方行为未变化”时，第一步检查真实解析路径：`node -p "require.resolve('@rong/admin-ui/package.json')"`，再确认 `dist` 中包含本次改动。
- 使用 `link:../rong-admin-ui` 的消费方发生依赖预构建缓存时，构建共享包后重启消费方 dev server，并强制刷新浏览器。
- 禁止在消费方通过 `../rong-admin-ui/src` 绕过 package boundary；共享能力必须通过公开 package export 消费。

## 媒体资源上传

- 涉及上传、媒体、图片、视频、音频、封面、预览、回填、`storage_id` 或资源 URL 时，先读取 `../../happy-rise-skills/hrs-skill-rong-app-dev/rong-code-governance/references/gates/media-resource-contract.md`。
- 开发新上传能力前先检查 `docs/admin-ui-framework/components/catalog.md`。显式业务表单中的单个持久化媒体字段优先使用 `RMediaResourceUpload`，Schema 驱动字段使用表单框架内部字段组件，多文件列表使用 `RProUpload`，图片裁剪使用 `RImageCropUpload`。
- 公共组件只表达中立资源语义；不得写入业务字段名、业务 API、业务默认 storage 或页面文案。
- 新增或修改公共上传组件时，同步维护 public export、类型、规格文档、组件测试和真实消费方验证。

## Review 门禁

- 禁止组件用裸 storage ID 构造成功预览项。
- 禁止上传响应缺少资源 ID 或 URL 时继续输出成功值。
- 禁止为单个业务字段复制一层只做字段改名的上传 wrapper。
