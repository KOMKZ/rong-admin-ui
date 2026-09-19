# RMediaResourceUpload

`RMediaResourceUpload` 是单媒体资源上传组件，位于 `business-neutral` 层。它复用
`RProUpload` 的传输和文件列表能力，并把页面需要长期维护的值收敛为完整
`MediaResource`：稳定 `storageId` 用于写入，`url` 与媒体元数据用于回填和预览。

## 合同

- 输入与输出均为 `MediaResource | null`，不接受裸 storage ID。
- 上传成功响应必须同时提供 `storage_id` 和 `url`，缺失时触发 `error`，不会产出伪成功值。
- `mediaClass` 与 `storage` 必须由消费方显式声明；组件不包含任何业务默认值。
- 组件只支持单资源。多资源列表继续使用 `RProUpload`。
- `include_media_info=true`、`media_class` 和业务标识由组件统一写入上传表单。

## 选择组件

| 场景                                                       | 组件                                 | 值模型                                  |
| ---------------------------------------------------------- | ------------------------------------ | --------------------------------------- |
| 显式业务表单中的单个持久化图片、视频或音频，需要刷新后回填 | `RMediaResourceUpload`               | `MediaResource \| null`                 |
| Schema 驱动的 `storage_id` 字段                            | 表单框架内部字段组件                 | 对外写值为 storage ID，内部保留资源投影 |
| 多文件通用上传列表                                         | `RProUpload`                         | `ProUploadFileItem[]`                   |
| 上传前需要图片裁剪                                         | `RImageCropUpload`                   | 裁剪组件既有合同                        |
| 业务页面只需要保存媒体字段                                 | `RMediaResourceUpload` + API adapter | 页面保存时提取 `storageId`              |

不要为了业务字段名不同再包装一层上传组件。业务页面只声明 `storage`、
`mediaClass`、`accept`、大小限制和文案；API adapter 负责 snake_case DTO 与
`MediaResource` 的转换。

## 读写边界

- 数据库和写接口只保存或接收稳定 storage ID，不保存 URL。
- 需要回填或预览的详情接口同时返回 storage ID、URL 和媒体元数据。
- `storageId` 不能直接作为图片、视频或音频地址，也不能由页面拼接为 URL。
- 上传响应缺少 storage ID 或 URL 时必须进入错误态，不能输出成功 model。
- 列表需要媒体展示时由后端读模型批量提供，页面不逐条查询资源。
- 图片和视频资源由公共预览 Dialog 展示：picture / picture-card 模式点击缩略项，text 模式点击文件名；视频使用浏览器原生 controls，关闭 Dialog 时停止播放并回到起点。
- 所有可预览入口都必须是明确的键盘可达控件，支持鼠标以及 Enter/Space 键触发，焦点状态使用设计系统 focus token。

## 使用

```vue
<RMediaResourceUpload
  v-model="cover"
  media-class="image"
  storage="sys_pub"
  accept="image/jpeg,image/png,image/webp"
  :max-size-m-b="10"
/>
```

消费方保存时只提交 `cover?.storageId`，详情 API 应返回完整资源对象供回填。

## 验证

- 组件测试覆盖已有资源回填、上传成功、缺 storage ID、缺 URL、删除，以及 picture-card / text 两种列表模式的视频点击播放；至少一条消费链路挂载真实 Dialog，不得只用 stub 证明弹框。
- 消费方测试覆盖保存后重新加载仍可预览。
- 公共能力变更同步检查组件导出、类型、规格、测试和真实消费方。
