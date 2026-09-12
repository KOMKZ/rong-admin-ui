<script setup lang="ts">
  import './mini-rich-text.css'
  import { computed } from 'vue'
  import type { MiniRichTextPreviewProps } from './types'
  import { sanitizeMiniRichText } from './sanitize'

  defineOptions({ name: 'RMiniRichTextPreview' })

  const props = withDefaults(defineProps<MiniRichTextPreviewProps>(), {
    content: '',
    emptyText: '暂无详情内容',
  })

  const safeContent = computed(() => sanitizeMiniRichText(props.content))
</script>

<template>
  <div class="r-mini-rich-preview" data-testid="mini-rich-text-preview">
    <div v-if="safeContent" class="r-mini-rich-preview__body" v-html="safeContent" />
    <div v-else class="r-mini-rich-preview__empty">{{ emptyText }}</div>
  </div>
</template>
