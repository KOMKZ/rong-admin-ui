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
  gap: 12px;
  max-width: 85%;
}
.r-chat-message--user {
  margin-left: auto;
  flex-direction: row-reverse;
}
.r-chat-message__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: var(--n-color-hover, #f5f5f5);
}
.r-chat-message__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.r-chat-message__role {
  font-size: 12px;
  opacity: 0.6;
  text-transform: capitalize;
}
.r-chat-message__content {
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--n-color-hover, #f5f5f5);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.r-chat-message--user .r-chat-message__content {
  background: var(--n-color-target, #18a058);
  color: white;
}
.r-chat-message__meta {
  font-size: 11px;
  opacity: 0.5;
}
</style>
