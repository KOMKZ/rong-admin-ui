# RMarkdownEditor

Markdown 编辑器组件，支持分屏编辑/预览、纯编辑、纯预览三种视图模式。

## 基本用法

```vue
<script setup>
import { ref } from 'vue'
import { RMarkdownEditor } from '@rong/admin-ui/components/markdown-editor'

const content = ref('# Hello World')
</script>

<template>
  <RMarkdownEditor v-model="content" height="600px" @save="handleSave" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | `''` | v-model 双向绑定 Markdown 源码 |
| `viewMode` | `'split' \| 'edit' \| 'preview'` | `'split'` | 视图模式 |
| `defaultSplitRatio` | `number` | `0.5` | 分屏默认比例（0-1） |
| `previewScale` | `number` | `50` | 预览缩放比例（30-100） |
| `height` | `string \| number` | `'100%'` | 编辑器高度 |
| `placeholder` | `string` | `'在此输入 Markdown 内容...'` | 占位文本 |
| `readonly` | `boolean` | `false` | 只读模式 |
| `showModeToggle` | `boolean` | `true` | 是否显示模式切换按钮 |
| `showScaleControl` | `boolean` | `true` | 是否显示缩放控制 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: string)` | 内容变更 |
| `update:viewMode` | `(mode: string)` | 视图模式变更 |
| `save` | `(content: string)` | 保存事件（Cmd/Ctrl+S 触发） |

## Slots

| 插槽 | 说明 |
|------|------|
| `toolbar-left` | 工具栏左侧自定义内容 |
| `toolbar-right` | 工具栏右侧自定义内容 |

## 功能特性

- 三种视图模式：分屏 | 纯编辑 | 纯预览
- 分屏模式支持拖拽调整比例（20%-80%）
- 预览区缩放控制（30%-100%）
- 等宽字体代码输入体验
- 快捷键：`Cmd/Ctrl+S` 保存、`Tab` 缩进
- 内置 RMarkdownPreview 作为预览引擎
