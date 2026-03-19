<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NSpace } from 'naive-ui'
import { Send, Square, Paperclip } from 'lucide-vue-next'

interface Props {
  disabled?: boolean
  loading?: boolean
  isStreaming?: boolean
  placeholder?: string
  maxLength?: number
}

interface Emits {
  (e: 'send', content: string): void
  (e: 'stop'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  isStreaming: false,
  placeholder: '输入消息...',
  maxLength: 4096,
})

const emit = defineEmits<Emits>()
const content = ref('')
const inputRef = ref<{ focus: () => void } | null>(null)

function focus() {
  inputRef.value?.focus?.()
}

defineExpose({ focus })

function handleSend() {
  const trimmed = content.value.trim()
  if (!trimmed) return
  emit('send', trimmed)
  content.value = ''
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
</script>

<template>
  <NSpace vertical :size="8">
    <div class="r-chat-input__wrapper">
      <div class="r-chat-input__toolbar">
        <NButton
          size="small"
          quaternary
          disabled
          title="附件（即将支持）"
          aria-label="附件（即将支持）"
        >
          <Paperclip :size="18" />
        </NButton>
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
        :disabled="!content.trim() || disabled"
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
</style>
