<script setup lang="ts">
import { NButton } from 'naive-ui'
import { MessageSquarePlus } from 'lucide-vue-next'

interface Props {
  title?: string
  description?: string
  suggestions?: string[]
}

interface Emits {
  (e: 'start'): void
  (e: 'select-prompt', prompt: string): void
}

withDefaults(defineProps<Props>(), {
  title: '开始新的对话',
  description: '选择一个 AI 模型，开始你的第一次对话',
  suggestions: () => [],
})
defineEmits<Emits>()
</script>

<template>
  <div class="r-chat-empty-state">
    <div class="r-chat-empty-state__icon">
      <MessageSquarePlus :size="48" stroke-width="1.5" />
    </div>
    <h3 class="r-chat-empty-state__title">{{ title }}</h3>
    <p class="r-chat-empty-state__desc">{{ description }}</p>
    <div v-if="suggestions.length" class="r-chat-empty-state__suggestions">
      <button
        v-for="(s, i) in suggestions"
        :key="i"
        type="button"
        class="r-chat-empty-state__suggestion"
        :aria-label="`选择建议: ${s}`"
        @click="$emit('select-prompt', s)"
      >
        {{ s }}
      </button>
    </div>
    <NButton type="primary" aria-label="开始新对话" @click="$emit('start')">开始对话</NButton>
  </div>
</template>

<style scoped>
.r-chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--ra-spacing-4, 16px);
  padding: 40px;
  text-align: center;
}
.r-chat-empty-state__icon {
  color: var(--ra-color-text-tertiary, #6e7389);
  opacity: 0.7;
}
.r-chat-empty-state__title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.r-chat-empty-state__desc {
  opacity: 0.6;
  margin: 0;
  max-width: 360px;
}
.r-chat-empty-state__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ra-spacing-2, 8px);
  justify-content: center;
  max-width: 480px;
}
.r-chat-empty-state__suggestion {
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-3, 12px);
  font-size: var(--ra-font-size-sm, 13px);
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: var(--ra-radius-md, 8px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #4a5164);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}
.r-chat-empty-state__suggestion:hover {
  border-color: var(--ra-color-primary, #3b82f6);
  background: var(--ra-color-bg-subtle, #f8fafc);
  color: var(--ra-color-primary, #3b82f6);
}
</style>
