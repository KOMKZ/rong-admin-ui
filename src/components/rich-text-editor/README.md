# RRichTextEditor

基于 Tiptap 封装的富文本编辑器组件，支持多主题切换、完整工具栏、图片上传适配器。

## 基本用法

```vue
<script setup>
import { ref } from 'vue'
import { RRichTextEditor } from '@rong/admin-ui/components/rich-text-editor'

const content = ref('<p>Hello World</p>')
</script>

<template>
  <RRichTextEditor v-model="content" height="600px" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | `''` | v-model 双向绑定 HTML 内容 |
| `placeholder` | `string` | `'开始输入...'` | 占位文本 |
| `readonly` | `boolean` | `false` | 只读模式 |
| `bordered` | `boolean` | `true` | 显示边框 |
| `theme` | `'classic' \| 'minimal' \| 'midnight' \| 'aurora'` | `'classic'` | 编辑器主题 |
| `height` | `string \| number` | - | 编辑区高度 |
| `maxHeight` | `string \| number` | - | 最大高度 |
| `toolbar` | `ToolbarConfig \| false` | - | 工具栏配置或隐藏 |
| `extensions` | `TiptapExtension[]` | `[]` | 自定义 Tiptap 扩展 |
| `imageUploadAdapter` | `ImageUploadAdapter` | - | 图片上传适配器 |
| `i18n` | `RichTextEditorI18n` | - | 国际化文案 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: string)` | 内容变更 |
| `focus` | - | 获得焦点 |
| `blur` | - | 失去焦点 |
| `ready` | `(editor: Editor)` | 编辑器就绪 |

## 功能特性

- 基于 Tiptap 2 封装
- 四种主题：经典 / 雾灰 / 午夜 / 极光
- 完整工具栏：标题、加粗、斜体、列表、表格、代码块等
- 图片上传适配器模式
- 回到顶部悬浮按钮
- 可扩展的 Tiptap 插件体系

## 图片上传适配器

```vue
<RRichTextEditor
  v-model="content"
  :image-upload-adapter="{
    upload: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      return data.url
    }
  }"
/>
```
