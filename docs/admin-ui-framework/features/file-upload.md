# FileUpload — 文件上传能力

## 背景

后台管理中的附件上传、头像上传、批量文件管理需要统一组件。

## 输入

- `fileList: UploadFile[]` — 文件列表（双向绑定）
- `customRequest` — 自定义上传函数
- `maxCount / maxSize / accept / multiple` — 文件约束
- `draggable` — 拖拽上传模式
- `listType` — 列表展示类型（text / image / image-card）

## 输出

- `update:fileList` — 文件列表变化
- `beforeUpload` — 上传前拦截
- `change` — 文件状态变化
- `remove` — 文件移除
- `preview` — 文件预览

## 文件状态机

```
pending → uploading → success
pending → uploading → error
```

## Expose API

| 方法 | 说明 |
|------|------|
| submit() | 手动触发上传 |
| clear() | 清空文件列表 |
| abort(fileId) | 取消指定文件上传 |

## 示例

```vue
<RFileUpload
  :file-list="files"
  :custom-request="uploadToOSS"
  :max-count="5"
  :max-size="5 * 1024 * 1024"
  accept="image/*,.pdf"
  @update:file-list="files = $event"
  @before-upload="handleBeforeUpload"
/>
```
