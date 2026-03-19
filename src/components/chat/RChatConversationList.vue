<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NScrollbar, NEmpty } from 'naive-ui'
import type { ChatConversation } from './types'

interface Props {
  conversations: ChatConversation[]
  activeId?: number
  loading?: boolean
}

interface Emits {
  (e: 'select', id: number): void
  (e: 'create'): void
  (e: 'delete', id: number): void
}

withDefaults(defineProps<Props>(), { loading: false })
defineEmits<Emits>()

const searchKeyword = ref('')
</script>

<template>
  <div class="r-chat-conv-list">
    <div class="r-chat-conv-list__header">
      <NButton type="primary" block @click="$emit('create')">新建对话</NButton>
      <NInput v-model:value="searchKeyword" placeholder="搜索对话..." clearable size="small" />
    </div>
    <NScrollbar class="r-chat-conv-list__body">
      <NEmpty v-if="!conversations.length" description="暂无对话" />
      <div
        v-for="conv in conversations.filter(c => !searchKeyword || c.title.includes(searchKeyword))"
        :key="conv.id"
        class="r-chat-conv-list__item"
        :class="{ 'r-chat-conv-list__item--active': conv.id === activeId }"
        @click="$emit('select', conv.id)"
      >
        <div class="r-chat-conv-list__item-title">{{ conv.title || '未命名对话' }}</div>
        <div class="r-chat-conv-list__item-meta">
          {{ conv.message_count }} 条消息 · {{ conv.model }}
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<style scoped>
.r-chat-conv-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.r-chat-conv-list__header {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.r-chat-conv-list__body {
  flex: 1;
  padding: 0 8px;
}
.r-chat-conv-list__item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}
.r-chat-conv-list__item:hover {
  background: var(--n-color-hover, #f5f5f5);
}
.r-chat-conv-list__item--active {
  background: var(--n-color-target, #e8f5e9);
}
.r-chat-conv-list__item-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.r-chat-conv-list__item-meta {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 4px;
}
</style>
