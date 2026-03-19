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
  gap: var(--ra-spacing-3, 12px);
  height: 100%;
  overflow: hidden;
  padding: var(--ra-spacing-3, 12px);
}
.r-chat-panel__sidebar {
  width: var(--ra-chat-sidebar-width, 280px);
  min-width: var(--ra-chat-sidebar-width, 280px);
  background: var(--ra-color-bg-surface, #fff);
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: var(--ra-radius-lg, 12px);
  box-shadow: var(--ra-shadow-card, 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03));
  overflow-y: auto;
}
.r-chat-panel__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ra-color-bg-surface, #fff);
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: var(--ra-radius-lg, 12px);
  box-shadow: var(--ra-shadow-card, 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03));
}
.r-chat-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--ra-spacing-4, 16px);
}
.r-chat-panel__input {
  padding: var(--ra-spacing-3, 12px) var(--ra-spacing-4, 16px);
  border-top: 1px solid var(--ra-chat-border-color);
}
</style>
