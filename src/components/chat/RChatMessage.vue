<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, Bot, Copy, Pencil, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-vue-next'
import { NButton, NTag, NInput, NCollapse, NCollapseItem } from 'naive-ui'
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

/** Extract citations from metadata for assistant messages (CHATADV-006 + CHATWEB-009). */
const citations = computed(() => {
  const raw = props.message.metadata?.citations
  if (!raw || !Array.isArray(raw)) return []
  return raw as Array<{ title?: string; url?: string; snippet?: string }>
})

/** Extract tool_calls from metadata for assistant messages (CHATADV-013). */
const toolCalls = computed(() => {
  const raw = props.message.metadata?.tool_calls
  if (!raw || !Array.isArray(raw)) return []
  return raw as Array<{
    name?: string
    args?: string | Record<string, unknown>
    arguments?: string
    result?: string
  }>
})

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function formatJson(s: string | Record<string, unknown>): string {
  if (typeof s === 'object') return JSON.stringify(s, null, 2)
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}
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
      <div v-if="message.role === 'assistant' && toolCalls.length" class="r-chat-message__tool-calls">
        <NCollapse :default-expanded-names="[]">
          <NCollapseItem
            v-for="(tc, idx) in toolCalls"
            :key="idx"
            :name="`tc-${idx}`"
          >
            <template #header>
              <div class="r-chat-message__tool-call-header">
                <span class="r-chat-message__tool-icon">🔧</span>
                <span>{{ tc.name || '未命名工具' }}</span>
              </div>
            </template>
            <div class="r-chat-message__tool-call-body">
              <div v-if="tc.arguments || tc.args" class="r-chat-message__tool-section">
                <div class="r-chat-message__tool-label">参数</div>
                <pre class="r-chat-message__tool-pre">{{ formatJson((tc.arguments ?? tc.args)!) }}</pre>
              </div>
              <div v-if="tc.result" class="r-chat-message__tool-section">
                <div class="r-chat-message__tool-label">结果</div>
                <pre class="r-chat-message__tool-pre">{{ tc.result }}</pre>
              </div>
            </div>
          </NCollapseItem>
        </NCollapse>
      </div>
      <div v-if="message.role === 'assistant' && citations.length" class="r-chat-message__citations">
        <div class="r-chat-message__citations-header">
          <span class="r-chat-message__citations-label">引用来源</span>
          <span class="r-chat-message__citations-count">{{ citations.length }} 条</span>
        </div>
        <div class="r-chat-message__citations-list">
          <a
            v-for="(cite, idx) in citations"
            :key="idx"
            :href="cite.url || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="r-chat-message__citation-card"
            :title="cite.snippet || cite.title || cite.url"
          >
            <span class="r-chat-message__citation-index">{{ idx + 1 }}</span>
            <span class="r-chat-message__citation-info">
              <span class="r-chat-message__citation-title">{{ cite.title || cite.url || 'Source' }}</span>
              <span v-if="cite.url" class="r-chat-message__citation-domain">{{ extractDomain(cite.url) }}</span>
            </span>
          </a>
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
}
.r-chat-message__citations-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.r-chat-message__citations-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ra-color-text-secondary, #6e7389);
}
.r-chat-message__citations-count {
  font-size: 11px;
  color: var(--ra-color-text-tertiary, #999);
}
.r-chat-message__citations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.r-chat-message__citation-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--ra-color-bg-subtle, #f8fafc);
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
  max-width: 240px;
}
.r-chat-message__citation-card:hover {
  background: var(--ra-color-primary-light, #e8f0fe);
  border-color: var(--ra-color-primary, #2563eb);
}
.r-chat-message__citation-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ra-color-primary, #2563eb);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}
.r-chat-message__citation-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  min-width: 0;
}
.r-chat-message__citation-title {
  font-size: 12px;
  color: var(--ra-color-text-primary, #1a1a1a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.r-chat-message__citation-domain {
  font-size: 10px;
  color: var(--ra-color-text-tertiary, #999);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-chat-message__tool-calls {
  margin-top: var(--ra-spacing-2, 8px);
  font-size: var(--ra-font-size-2xs, 11px);
}
.r-chat-message__tool-call-header {
  display: flex;
  align-items: center;
  gap: 4px;
}
.r-chat-message__tool-icon {
  opacity: 0.7;
}
.r-chat-message__tool-call-body {
  padding-top: 4px;
}
.r-chat-message__tool-section {
  margin-bottom: 8px;
}
.r-chat-message__tool-label {
  font-weight: 500;
  margin-bottom: 2px;
  opacity: 0.85;
}
.r-chat-message__tool-pre {
  margin: 0;
  padding: 8px;
  background: var(--ra-color-bg-tertiary, #f5f6f8);
  border-radius: 6px;
  font-size: 11px;
  overflow-x: auto;
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
