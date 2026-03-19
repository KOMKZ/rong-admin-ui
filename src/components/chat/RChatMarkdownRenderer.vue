<script setup lang="ts">
import RMarkdownPreview from '../markdown-preview/RMarkdownPreview.vue'

interface Props {
  content: string
}

defineProps<Props>()
</script>

<template>
  <div class="r-chat-markdown-renderer">
    <RMarkdownPreview :content="content" />
  </div>
</template>

<style scoped>
.r-chat-markdown-renderer {
  line-height: 1.6;
  word-break: break-word;
}
.r-chat-markdown-renderer :deep(pre) {
  background: var(--n-color-hover, #f5f5f5);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}
.r-chat-markdown-renderer :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}
.r-chat-markdown-renderer :deep(p) {
  margin: 0.5em 0;
}
</style>
