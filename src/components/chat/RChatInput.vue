<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NSpace, useMessage } from 'naive-ui'
import { Send, Square, Paperclip, Globe } from 'lucide-vue-next'

export interface AttachmentItem {
  url: string
  filename: string
  isImage?: boolean
}

interface Props {
  disabled?: boolean
  loading?: boolean
  isStreaming?: boolean
  placeholder?: string
  maxLength?: number
  webSearchEnabled?: boolean
  /** CHATADV-001: upload file and return URL; when provided, attachment button is enabled */
  uploadFile?: (file: File) => Promise<{ url: string; filename?: string }>
}

interface Emits {
  (e: 'send', content: string, attachments?: string[]): void
  (e: 'stop'): void
  (e: 'update:webSearchEnabled', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  isStreaming: false,
  placeholder: '输入消息...',
  maxLength: 4096,
  webSearchEnabled: false,
})

const msg = useMessage()
const emit = defineEmits<Emits>()
const content = ref('')
const inputRef = ref<{ focus: () => void } | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const attachments = ref<AttachmentItem[]>([])
const uploadIng = ref(false)

function focus() {
  inputRef.value?.focus?.()
}

defineExpose({ focus })

function handleSend() {
  const trimmed = content.value.trim()
  if (!trimmed && attachments.value.length === 0) return
  const urls = attachments.value.map((a) => a.url)
  emit('send', trimmed || '', urls.length ? urls : undefined)
  content.value = ''
  attachments.value = []
}

function handleStop() {
  emit('stop')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !props.isStreaming) {
    e.preventDefault()
    handleSend()
  }
}

function triggerFileSelect() {
  if (!props.uploadFile || props.disabled || props.loading) return
  fileInputRef.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !props.uploadFile) return
  uploadIng.value = true
  try {
    const res = await props.uploadFile(file)
    attachments.value.push({
      url: res.url,
      filename: res.filename ?? file.name,
      isImage: file.type.startsWith('image/'),
    })
  } catch (err) {
    msg.error(err instanceof Error ? err.message : '上传失败')
  } finally {
    uploadIng.value = false
  }
}

function removeAttachment(index: number) {
  attachments.value = attachments.value.filter((_, i) => i !== index)
}
</script>

<template>
  <NSpace vertical :size="8">
    <div class="r-chat-input__wrapper">
      <div class="r-chat-input__toolbar">
        <NButton
          size="small"
          quaternary
          :type="webSearchEnabled ? 'primary' : undefined"
          :title="webSearchEnabled ? '联网搜索已开启' : '联网搜索（即将支持）'"
          :aria-label="webSearchEnabled ? '联网搜索已开启' : '联网搜索'"
          @click="emit('update:webSearchEnabled', !webSearchEnabled)"
        >
          <Globe :size="18" />
        </NButton>
        <NButton
          size="small"
          quaternary
          :disabled="!uploadFile || disabled || loading"
          :loading="uploadIng"
          title="上传附件"
          aria-label="上传附件"
          @click="triggerFileSelect"
        >
          <Paperclip :size="18" />
        </NButton>
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          class="r-chat-input__file-input"
          @change="onFileChange"
        >
      </div>
      <div v-if="attachments.length" class="r-chat-input__attachments">
        <div
          v-for="(att, idx) in attachments"
          :key="att.url"
          class="r-chat-input__attachment"
        >
          <img
            v-if="att.isImage"
            :src="att.url"
            :alt="att.filename"
            class="r-chat-input__thumb"
          >
          <span v-else class="r-chat-input__filename">{{ att.filename }}</span>
          <NButton size="tiny" quaternary @click="removeAttachment(idx)">
            ×
          </NButton>
        </div>
      </div>
      <NInput
        ref="inputRef"
        v-model:value="content"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :disabled="disabled || loading"
        show-count
        class="r-chat-input__textarea"
        :input-props="{ role: 'textbox', 'aria-label': '输入消息' }"
        @keydown="handleKeydown"
      />
    </div>
    <NSpace justify="end">
      <NButton
        v-if="isStreaming"
        type="primary"
        :disabled="disabled"
        aria-label="停止生成"
        @click="handleStop"
      >
        <Square :size="16" style="margin-right: 6px" />
        停止生成
      </NButton>
      <NButton
        v-else
        type="primary"
        :disabled="(!content.trim() && !attachments.length) || disabled"
        :loading="loading"
        aria-label="发送消息"
        @click="handleSend"
      >
        <Send :size="16" style="margin-right: 6px" />
        发送
      </NButton>
    </NSpace>
  </NSpace>
</template>

<style scoped>
.r-chat-input__wrapper {
  width: 100%;
}
.r-chat-input__toolbar {
  display: flex;
  gap: var(--ra-spacing-1, 4px);
  margin-bottom: var(--ra-spacing-1, 4px);
}
.r-chat-input__textarea {
  width: 100%;
}
.r-chat-input__file-input {
  display: none;
}
.r-chat-input__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}
.r-chat-input__attachment {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--ra-color-bg-2, #f0f0f0);
  border-radius: 4px;
}
.r-chat-input__thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.r-chat-input__filename {
  font-size: 12px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
