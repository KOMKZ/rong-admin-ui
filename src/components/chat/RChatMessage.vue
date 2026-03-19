<script setup lang="ts">
import { ref } from 'vue'
import { User, Bot, Copy } from 'lucide-vue-next'
import { NButton, NTag } from 'naive-ui'
import type { ChatMessage } from './types'

interface Props {
  message: ChatMessage
  showAvatar?: boolean
}

const props = withDefaults(defineProps<Props>(), { showAvatar: true })
const copied = ref(false)

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    user: '用户',
    assistant: '助手',
    system: '系统',
    tool: '工具',
  }
  return map[role] ?? role
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="r-chat-message" :class="`r-chat-message--${message.role}`">
    <div v-if="showAvatar" class="r-chat-message__avatar">
      <User v-if="message.role === 'user'" :size="20" />
      <Bot v-else :size="20" />
    </div>
    <div class="r-chat-message__body">
      <div class="r-chat-message__meta-row">
        <NTag size="small" :bordered="false" class="r-chat-message__role-badge">
          {{ getRoleLabel(message.role) }}
        </NTag>
        <span class="r-chat-message__time">
          {{ new Date(message.created_at).toLocaleTimeString() }}
        </span>
        <NTag v-if="message.token_count" size="small" :bordered="false" class="r-chat-message__token-badge">
          {{ message.token_count }} tokens
        </NTag>
      </div>
      <div class="r-chat-message__content">
        <slot>{{ message.content }}</slot>
      </div>
      <div class="r-chat-message__actions">
        <NButton size="tiny" quaternary @click="handleCopy">
          <Copy :size="14" />
          {{ copied ? '已复制' : '复制' }}
        </NButton>
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
  flex-shrink: 0;
  background: var(--ra-chat-avatar-bg, #f0f2f5);
  color: var(--ra-color-text-secondary, #6e7389);
}
.r-chat-message--user .r-chat-message__avatar {
  background: var(--ra-color-primary-light, #e8f0fe);
  color: var(--ra-color-primary, #2563eb);
}
.r-chat-message__body {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-1, 4px);
}
.r-chat-message__meta-row {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  flex-wrap: wrap;
}
.r-chat-message__role-badge {
  font-size: var(--ra-font-size-2xs, 11px);
}
.r-chat-message__time {
  font-size: var(--ra-font-size-2xs, 11px);
  opacity: 0.5;
}
.r-chat-message__token-badge {
  font-size: var(--ra-font-size-2xs, 11px);
  opacity: 0.7;
}
.r-chat-message__content {
  padding: var(--ra-chat-bubble-padding, 12px 16px);
  border-radius: var(--ra-chat-bubble-radius, 12px);
  background: var(--ra-chat-bubble-assistant-bg);
  color: var(--ra-chat-bubble-assistant-text);
  line-height: 1.6;
  word-break: break-word;
}
.r-chat-message--user .r-chat-message__content {
  background: var(--ra-chat-bubble-user-bg);
  color: var(--ra-chat-bubble-user-text);
}
.r-chat-message__content :deep(.r-chat-markdown-renderer) {
  white-space: normal;
}
.r-chat-message__content :deep(pre) {
  white-space: pre-wrap;
}
.r-chat-message__actions {
  margin-top: var(--ra-spacing-1, 4px);
}
.r-chat-message--user .r-chat-message__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
