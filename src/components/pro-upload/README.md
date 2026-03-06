# RProUpload 商业化上传组件

> 对接 `go-yogan-domain-storage` 的专业文件上传组件，支持图片预览、拖拽上传、并发控制、失败重试、受控模式等企业级能力。

## 快速使用

```vue
<template>
  <RProUpload
    v-model:value="fileList"
    storage="avatar"
    :max-count="1"
    :max-size-m-b="2"
    accept=".jpg,.jpeg,.png,.gif"
    :custom-request="handleUpload"
    @success="onSuccess"
    @error="onError"
  />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `ProUploadFileItem[]` | — | 受控文件列表 |
| `multiple` | `boolean` | `false` | 是否允许多选 |
| `accept` | `string` | — | 接受的文件类型（`.jpg,.png` 或 `image/*`） |
| `maxCount` | `number` | — | 最大文件数量 |
| `maxSizeMB` | `number` | — | 单文件最大 MB |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `readonly` | `boolean` | `false` | 只读状态（展示文件，不可操作） |
| `draggable` | `boolean` | `true` | 是否启用拖拽上传 |
| `concurrency` | `number` | `3` | 并发上传数 |
| `retryConfig` | `{ maxRetries, retryDelay }` | `{ 2, 1000 }` | 失败重试策略 |
| `storage` | `string` | — | 存储类型（avatar/image/document） |
| `category` | `string` | — | 文件分类 |
| `businessId` | `string` | — | 关联业务 ID |
| `businessType` | `string` | — | 关联业务类型 |
| `listType` | `'text' \| 'picture' \| 'picture-card'` | `'picture-card'` | 展示方式 |
| `customRequest` | `(options) => void` | — | 自定义上传请求 |
| `beforeUpload` | `(file) => boolean \| Promise<boolean>` | — | 上传前拦截 |
| `buildUploadPayload` | `(file, ctx) => FormData` | — | 自定义 FormData 构建 |
| `parseResponse` | `(raw) => Partial<FileItem>` | — | 自定义响应解析 |
| `renderItem` | `({ file }) => VNode` | — | 自定义文件项渲染 |
| `locale` | `Partial<ProUploadLocale>` | — | 国际化文案覆盖 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `change` | `fileList` | 文件列表变更 |
| `update:value` | `fileList` | v-model 绑定 |
| `success` | `file, response` | 上传成功 |
| `error` | `file, error` | 上传失败 |
| `preview` | `file` | 点击预览 |
| `remove` | `file` | 文件被移除 |
| `exceed` | `{ type, file, limit }` | 超出限制（count/size/accept） |

## Expose

| 方法 | 说明 |
|------|------|
| `submit()` | 手动触发所有 pending 文件上传 |
| `clear()` | 清空所有文件（abort 进行中的上传） |
| `abort(uid)` | 取消指定文件上传 |
| `retry(uid)` | 重试失败文件 |
| `getFileList()` | 获取当前文件列表 |

## FileItem 结构

```typescript
interface ProUploadFileItem {
  uid: string          // 唯一标识
  name: string         // 文件名
  size: number         // 字节数
  type: string         // MIME 类型
  status: 'pending' | 'queued' | 'uploading' | 'success' | 'error'
  progress: number     // 上传进度 0-100
  url?: string         // 访问地址
  thumbUrl?: string    // 缩略图地址
  storageId?: string   // 存储域 ID（driver:storage@filename）
  fileId?: number      // 数据库记录 ID
  error?: string       // 错误信息
}
```

## 对接 storage 域

### 默认 FormData 映射

组件默认构建的 FormData 字段：

| FormData 字段 | 来源 |
|---------------|------|
| `file` | File 对象 |
| `type` | props.storage |
| `business_id` | props.businessId |
| `business_type` | props.businessType |

### 默认响应解析

支持以下两种后端响应格式：

```json
// 包装格式
{ "code": 0, "data": { "id": 1, "storage_id": "...", "url": "..." } }

// 扁平格式
{ "storage_id": "...", "url": "..." }
```

### 头像场景示例

```vue
<RProUpload
  v-model:value="avatarList"
  :multiple="false"
  :max-count="1"
  :max-size-m-b="2"
  accept=".jpg,.jpeg,.png,.gif"
  storage="avatar"
  :business-id="userId"
  business-type="admin"
  list-type="picture-card"
  :custom-request="uploadAvatar"
/>
```

## 可访问性

- 触发区域可键盘聚焦（Enter/Space 打开文件选择）
- 文件项带 `role="listitem"`、`aria-label`
- 操作按钮带 `aria-label`
- 预览弹窗支持 Escape 关闭

## 主题

所有颜色使用 `--ra-*` 语义 CSS 变量，支持主题切换。
