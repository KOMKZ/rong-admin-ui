<script setup lang="ts">
import type { ChatMessage } from './types'

interface Props {
  message: ChatMessage
  showAvatar?: boolean
}

withDefaults(defineProps<Props>(), { showAvatar: true })
</script>

<template>
  <div class="r-chat-message" :class="`r-chat-message--${message.role}`">
    <div v-if="showAvatar" class="r-chat-message__avatar">
      {{ message.role === 'user' ? '👤' : message.role === 'assistant' ? '🤖' : '⚙️' }}
    </div>
    <div class="r-chat-message__body">
      <div class="r-chat-message__role">{{ message.role }}</div>
      <div class="r-chat-message__content">
        <slot>{{ message.content }}</slot>
      </div>
      <div class="r-chat-message__meta">
        {{ new Date(message.created_at).toLocaleTimeString() }}
        <span v-if="message.token_count"> · {{ message.token_count }} tokens</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-chat-message {
  display: flex;
  gap: var(--ra-spacing-3, 12px);
  max-width: 85%;
}
.r-chat-message--user {
  margin-left: auto;
  flex-direction: row-reverse;
}
.r-chat-message__avatar {
  width: var(--ra-chat-avatar-size, 36px);
  height: var(--ra-chat-avatar-size, 36px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: var(--ra-chat-avatar-bg);
}
.r-chat-message__body {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-1, 4px);
}
.r-chat-message__role {
  font-size: var(--ra-font-size-xs, 12px);
  opacity: 0.6;
  text-transform: capitalize;
}
.r-chat-message__content {
  padding: var(--ra-chat-bubble-padding, 12px 16px);
  border-radius: var(--ra-chat-bubble-radius, 12px);
  background: var(--ra-chat-bubble-assistant-bg);
  color: var(--ra-chat-bubble-assistant-text);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.r-chat-message__meta {
  font-size: var(--ra-font-size-2xs, 11px);
  opacity: 0.5;
}
.r-chat-message--user .r-chat-message__content {
  background: var(--ra-chat-bubble-user-bg);
  color: var(--ra-chat-bubble-user-text);
}
</style>
