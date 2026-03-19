<script setup lang="ts">
import type { ChatConversation } from './types'

interface Props {
  conversations: ChatConversation[]
  activeConversationId?: number
  loading?: boolean
}

interface Emits {
  (e: 'select', id: number): void
  (e: 'create'): void
  (e: 'delete', id: number): void
  (e: 'rename', id: number, title: string): void
}

withDefaults(defineProps<Props>(), { loading: false })
defineEmits<Emits>()
</script>

<template>
  <div class="r-chat-panel">
    <div class="r-chat-panel__sidebar">
      <slot name="sidebar" />
    </div>
    <div class="r-chat-panel__main">
      <slot name="header" />
      <div class="r-chat-panel__messages">
        <slot name="messages" />
      </div>
      <div class="r-chat-panel__input">
        <slot name="input" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-chat-panel {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.r-chat-panel__sidebar {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid var(--n-border-color, #e0e0e6);
  overflow-y: auto;
}
.r-chat-panel__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.r-chat-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.r-chat-panel__input {
  padding: 12px 16px;
  border-top: 1px solid var(--n-border-color, #e0e0e6);
}
</style>
