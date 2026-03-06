# RMarkdownPreview

Markdown 渲染预览组件，基于 markdown-it 实现 GitHub 风格渲染，支持代码高亮和 Mermaid 图表。

## 基本用法

```vue
<script setup>
import { RMarkdownPreview } from '@rong/admin-ui/components/markdown-preview'
</script>

<template>
  <RMarkdownPreview :content="markdownSource" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | `''` | Markdown 源码 |
| `scale` | `number` | `100` | 缩放比例（百分比） |
| `theme` | `'github' \| 'github-dark'` | `'github'` | 渲染主题 |
| `enableMermaid` | `boolean` | `true` | 是否启用 Mermaid 图表渲染 |
| `enableHighlight` | `boolean` | `true` | 是否启用代码高亮 |
| `highlightTheme` | `string` | `'github-dark'` | 代码高亮主题 |

## 功能特性

- GitHub 风格 Markdown 渲染样式
- 代码块语法高亮（highlight.js）
- Mermaid 图表渲染 + 全屏查看
- 支持缩放显示
- 响应式表格、图片
- 明/暗两种主题
- 异步加载 highlight.js 和 mermaid（按需加载）

## Mermaid 全屏查看

Mermaid 图表渲染后，右上角会出现全屏按钮。进入全屏后支持：

- 鼠标滚轮缩放
- 鼠标拖拽平移
- 快捷键：`Cmd/Ctrl + =` 放大、`Cmd/Ctrl + -` 缩小、`Cmd/Ctrl + 0` 适应屏幕、`Esc` 退出
- 双击画布适应屏幕

## 主题切换

```vue
<RMarkdownPreview :content="md" theme="github-dark" />
```
