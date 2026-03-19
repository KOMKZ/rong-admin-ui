<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, Bot, Copy, Pencil, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-vue-next'
import { NButton, NTag, NInput } from 'naive-ui'
import type { ChatMessage } from './types'

interface Props {
  message: ChatMessage
  showAvatar?: boolean
}

interface Emits {
  (e: 'edit-resend', payload: { messageId: number; newContent: string }): void
  (e: 'feedback', payload: { messageId: number; rating: 'up' | 'down' }): void
  (e: 'regenerate', payload: { messageId: number }): void
}

const props = withDefaults(defineProps<Props>(), { showAvatar: true })
const emit = defineEmits<Emits>()
const copied = ref(false)

/** Extract citations from metadata for assistant messages (CHATADV-006). */
const citations = computed(() => {
  const raw = props.message.metadata?.citations
  if (!raw || !Array.isArray(raw)) return []
  return raw as Array<{ title?: string; url?: string }>
})
const isEditing = ref(false)
const editContent = ref('')

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

function startEdit() {
  editContent.value = props.message.content
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function confirmEdit() {
  const trimmed = editContent.value.trim()
  if (trimmed && trimmed !== props.message.content) {
    emit('edit-resend', { messageId: props.message.id, newContent: trimmed })
  }
  isEditing.value = false
}

function handleFeedback(rating: 'up' | 'down') {
  emit('feedback', { messageId: props.message.id, rating })
}

function handleRegenerate() {
  emit('regenerate', { messageId: props.message.id })
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
      <div v-if="message.role === 'user' && isEditing" class="r-chat-message__edit">
        <NInput
          v-model:value="editContent"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 8 }"
          placeholder="编辑消息"
        />
        <div class="r-chat-message__edit-actions">
          <NButton size="small" @click="cancelEdit">取消</NButton>
          <NButton size="small" type="primary" @click="confirmEdit">确认发送</NButton>
        </div>
      </div>
      <div v-else class="r-chat-message__content">
        <slot>{{ message.content }}</slot>
      </div>
      <div v-if="message.role === 'assistant' && citations.length" class="r-chat-message__citations">
        <div
          v-for="(cite, idx) in citations"
          :key="idx"
          class="r-chat-message__citation"
        >
          <a v-if="cite.url" :href="cite.url" target="_blank" rel="noopener noreferrer">
            [{{ idx + 1 }}] {{ cite.title || cite.url || 'Source' }} - {{ cite.url }}
          </a>
          <span v-else>[{{ idx + 1 }}] {{ cite.title || 'Source' }}</span>
        </div>
      </div>
      <div v-if="!isEditing" class="r-chat-message__actions">
        <NButton
          v-if="message.role === 'user'"
          size="tiny"
          quaternary
          @click="startEdit"
          aria-label="编辑"
        >
          <Pencil :size="14" />
          编辑
        </NButton>
        <template v-if="message.role === 'assistant'">
          <NButton size="tiny" quaternary @click="handleCopy">
            <Copy :size="14" />
            {{ copied ? '已复制' : '复制全文' }}
          </NButton>
          <NButton
            size="tiny"
            quaternary
            :type="message.feedback === 'up' ? 'primary' : undefined"
            @click="handleFeedback('up')"
            aria-label="好评"
          >
            <ThumbsUp :size="14" />
          </NButton>
          <NButton
            size="tiny"
            quaternary
            :type="message.feedback === 'down' ? 'primary' : undefined"
            @click="handleFeedback('down')"
            aria-label="差评"
          >
            <ThumbsDown :size="14" />
          </NButton>
          <NButton size="tiny" quaternary @click="handleRegenerate" aria-label="重新生成">
            <RotateCcw :size="14" />
            重新生成
          </NButton>
        </template>
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
.r-chat-message__edit {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2, 8px);
}
.r-chat-message__edit-actions {
  display: flex;
  gap: var(--ra-spacing-2, 8px);
  justify-content: flex-end;
}
.r-chat-message__edit {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2, 8px);
}
.r-chat-message__edit-actions {
  display: flex;
  gap: var(--ra-spacing-2, 8px);
  justify-content: flex-end;
}
.r-chat-message__citations {
  margin-top: var(--ra-spacing-2, 8px);
  padding-top: var(--ra-spacing-2, 8px);
  border-top: 1px solid var(--ra-color-border-light, #eef0f6);
  font-size: var(--ra-font-size-2xs, 11px);
  opacity: 0.85;
}
.r-chat-message__citation {
  margin-bottom: var(--ra-spacing-1, 4px);
}
.r-chat-message__citation a {
  color: var(--ra-color-primary, #2563eb);
  text-decoration: none;
}
.r-chat-message__citation a:hover {
  text-decoration: underline;
}
.r-chat-message__actions {
  margin-top: var(--ra-spacing-1, 4px);
}
.r-chat-message--user .r-chat-message__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
