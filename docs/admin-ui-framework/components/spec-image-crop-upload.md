# RImageCropUpload 组件规格

## 1. 基本信息

- 组件名：`RImageCropUpload`
- 组件层级：business-neutral
- 目标场景：头像、封面、业务图片上传前裁切，并接入 storage 上传流程。
- 非目标场景：文档上传、导出文件上传、复杂图片编辑器、多图层编辑。

## 2. 契约定义

## Props

| 名称                 | 类型                       | 默认值 | 必填 | 说明                                           |
| -------------------- | -------------------------- | ------ | ---- | ---------------------------------------------- |
| `crop`               | `boolean`                  | `true` | 否   | 是否对图片文件启用裁切                         |
| `cropOptions`        | `ImageCropOptions`         | `{}`   | 否   | 裁切比例、输出尺寸、输出格式配置               |
| `cropLocale`         | `Partial<ImageCropLocale>` | `{}`   | 否   | 裁切弹窗文案                                   |
| `...RProUploadProps` | `ProUploadProps`           | 继承   | 否   | 复用上传、storage、headers、响应解析、队列配置 |

## Emits

| 事件名               | Payload 类型      | 触发时机                       | 说明                   |
| -------------------- | ----------------- | ------------------------------ | ---------------------- |
| `crop-success`       | `ImageCropResult` | 用户确认裁切并生成新文件       | 可用于审计裁切行为     |
| `crop-cancel`        | `File`            | 用户取消裁切                   | 当前文件不进入上传队列 |
| `crop-error`         | `Error`           | 图片尺寸校验或 Canvas 输出失败 | 保持弹窗可恢复         |
| `...RProUploadEmits` | `ProUploadEmits`  | 上传流程状态变化               | 与 `RProUpload` 一致   |

## Slots

| 名称       | 参数                          | 必填 | 回退行为                     |
| ---------- | ----------------------------- | ---- | ---------------------------- |
| `trigger`  | 无                            | 否   | 使用 `RProUpload` 默认触发器 |
| `tip`      | 无                            | 否   | 不展示额外提示               |
| `fileItem` | `{ file: ProUploadFileItem }` | 否   | 使用 `RProUploadItem`        |

## 3. 状态与交互

- 正常态：选择图片后打开裁切弹窗，确认后进入上传队列。
- 加载态：图片加载与 Canvas 导出期间展示 loading。
- 空态：无文件时显示上传触发器。
- 错误态：图片尺寸不足或导出失败时在弹窗中展示错误，并触发 `crop-error`。
- 禁用态：继承 `RProUpload` 的 `disabled/readonly` 行为。

## 4. 可访问性

- 键盘路径：上传触发器沿用 Enter/Space；裁切弹窗支持 Escape 取消。
- ARIA 语义：裁切弹窗使用 `role="dialog"`、`aria-modal`，工具按钮提供 `aria-label`。
- 对比度要求：正文 >= 4.5:1，关键图形 >= 3:1。

## 5. 性能预算

- 首次渲染：未打开裁切弹窗时只渲染上传组件。
- 交互响应：确认裁切后异步导出 Canvas，不阻塞其他页面区域。
- 重渲染阈值：裁切实例只在文件或弹窗可见状态变化时重建。

## 6. 样式契约

- 主题预设支持：enterprise-blue / teal-ops / graphite-pro
- 语义 token 清单：

| token                       | 用途             | 是否必须 |
| --------------------------- | ---------------- | -------- |
| `--ra-color-bg-muted`       | 裁切舞台背景     | 是       |
| `--ra-color-border-default` | 裁切舞台边框     | 是       |
| `--ra-color-brand-primary`  | 选区强调、主操作 | 是       |
| `--ra-color-danger`         | 错误文本         | 是       |
| `--ra-color-focus-ring`     | 焦点态           | 是       |

- 禁止硬编码颜色（hex/rgb/hsl）：是
- 焦点态 token：`--ra-color-focus-ring`

## 6.1 图标契约

- 图标来源（单一方案）：`lucide-vue-next`
- 图标尺寸刻度（16/18/20/24）：使用 `RIcon size="sm"`
- 图标状态映射：默认继承按钮文本色，主操作继承 primary 按钮语义
- 是否通过统一图标封装：是，使用 `RIcon`

## 7. 测试要求

- 单元测试：`cropper-utils` 文件名、MIME、Canvas 转文件。
- 契约测试：`RProUpload.transformFile` 调用顺序、转换后校验、取消跳过。
- 运行时验证场景：管理员头像选择图片、裁切、上传、保存。
- a11y 检查：弹窗 dialog 语义、按钮 aria-label、键盘取消路径。

## 8. Web 落地调用

- `hrise-admin-web` 调用页面：管理员新建/编辑表单。
- 调用文件路径：`src/views/admin/components/AdminAvatarUpload.vue`
- 运行验证证据：`pnpm build` 与头像人工冒烟。

## 9. Demo 矩阵

- basic：1:1 头像裁切上传。
- advanced：自定义输出尺寸、MIME 和质量。
- loading-empty-error：图片加载、无文件、尺寸不足或导出失败。
- disabled-readonly：继承上传组件禁用和只读展示。
- theme-variant：裁切弹窗使用语义 token，随主题切换。

## 10. 验收标准

- [ ] 契约完整
- [ ] 文档与示例可运行
- [ ] 测试通过
- [ ] token 合规（无硬编码颜色）
- [ ] 图标语法一致（来源/尺寸/线宽统一）
- [ ] web 已真实调用并验证
- [ ] demo 矩阵 5 场景完整
- [ ] 文档含场景说明与迁移建议
