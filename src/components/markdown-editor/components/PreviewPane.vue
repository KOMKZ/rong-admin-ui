<script lang="ts" setup>
import { RMarkdownPreview } from '../../markdown-preview'

withDefaults(
  defineProps<{
    content?: string
    scale?: number
  }>(),
  {
    content: '',
    scale: 100,
  },
)
</script>

<template>
  <div class="rme-preview-pane" data-testid="markdown-editor-preview">
    <div class="rme-preview-scroll">
      <RMarkdownPreview :content="content" :scale="scale" />
    </div>
  </div>
</template>

<style scoped>
.rme-preview-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rme-preview-scroll {
  flex: 1;
  overflow: auto;
  background: var(--ra-color-bg-surface, #fff);
  border-radius: var(--ra-radius-md, 4px);
}
</style>
