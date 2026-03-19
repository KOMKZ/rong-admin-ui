<script setup lang="ts">
import { NButton, NSpace } from 'naive-ui'

interface Props {
  title?: string
  description?: string
}

interface Emits {
  (e: 'start'): void
}

withDefaults(defineProps<Props>(), {
  title: '开始新的对话',
  description: '选择一个 AI 模型，开始你的第一次对话',
})
defineEmits<Emits>()
</script>

<template>
  <div class="r-chat-empty-state">
    <div class="r-chat-empty-state__icon">💬</div>
    <h3 class="r-chat-empty-state__title">{{ title }}</h3>
    <p class="r-chat-empty-state__desc">{{ description }}</p>
    <NSpace justify="center">
      <NButton type="primary" @click="$emit('start')">开始对话</NButton>
    </NSpace>
  </div>
</template>

<style scoped>
.r-chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  padding: 40px;
  text-align: center;
}
.r-chat-empty-state__icon {
  font-size: 48px;
}
.r-chat-empty-state__title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.r-chat-empty-state__desc {
  opacity: 0.6;
  margin: 0;
}
</style>
