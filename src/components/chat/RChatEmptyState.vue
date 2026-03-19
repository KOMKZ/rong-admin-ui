<script setup lang="ts">
import { NButton } from 'naive-ui'
import { MessageSquarePlus, Sparkles, Code, Languages, PenLine } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  title?: string
  description?: string
  suggestions?: string[]
}

interface Emits {
  (e: 'start'): void
  (e: 'select-prompt', prompt: string): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '开始新的对话',
  description: '选择一个 AI 模型，开始你的第一次对话',
  suggestions: () => [],
})
defineEmits<Emits>()

const suggestionIcons = [Sparkles, Code, Languages, PenLine]
const suggestionItems = computed(() =>
  props.suggestions.map((s, i) => ({
    text: s,
    icon: suggestionIcons[i % suggestionIcons.length],
  })),
)
</script>

<template>
  <div class="r-chat-empty-state">
    <div class="r-chat-empty-state__icon-circle">
      <MessageSquarePlus :size="32" stroke-width="1.5" />
    </div>
    <h3 class="r-chat-empty-state__title">{{ title }}</h3>
    <p class="r-chat-empty-state__desc">{{ description }}</p>
    <div v-if="suggestionItems.length" class="r-chat-empty-state__grid">
      <button
        v-for="(item, i) in suggestionItems"
        :key="i"
        type="button"
        class="r-chat-empty-state__card"
        :aria-label="`选择建议: ${item.text}`"
        @click="$emit('select-prompt', item.text)"
      >
        <component :is="item.icon" :size="16" class="r-chat-empty-state__card-icon" />
        <span class="r-chat-empty-state__card-text">{{ item.text }}</span>
      </button>
    </div>
    <NButton type="primary" size="large" aria-label="开始新对话" @click="$emit('start')">
      <template #icon><MessageSquarePlus :size="18" /></template>
      开始新对话
    </NButton>
  </div>
</template>

<style scoped>
.r-chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  padding: 48px 24px;
  text-align: center;
  max-width: 520px;
  margin: 0 auto;
}
.r-chat-empty-state__icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--ra-color-primary-light, #eff6ff);
  color: var(--ra-color-primary, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.r-chat-empty-state__title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: var(--ra-color-text-primary, #1a1a1a);
}
.r-chat-empty-state__desc {
  font-size: 14px;
  color: var(--ra-color-text-secondary, #4a5164);
  margin: 0;
  max-width: 360px;
  line-height: 1.5;
}
.r-chat-empty-state__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: 100%;
}
.r-chat-empty-state__card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  line-height: 1.4;
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: var(--ra-radius-md, 8px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #4a5164);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.r-chat-empty-state__card:hover {
  border-color: var(--ra-color-primary, #3b82f6);
  background: var(--ra-color-bg-subtle, #f8fafc);
  box-shadow: 0 2px 8px rgb(59 130 246 / 0.08);
}
.r-chat-empty-state__card-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--ra-color-primary, #3b82f6);
  opacity: 0.7;
}
.r-chat-empty-state__card-text {
  flex: 1;
  min-width: 0;
}
</style>
