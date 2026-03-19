<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NSpace } from 'naive-ui'
import { Send, Square } from 'lucide-vue-next'

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
    <NInput
      v-model:value="content"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 6 }"
      :placeholder="placeholder"
      :maxlength="maxLength"
      :disabled="disabled || loading"
      show-count
      @keydown="handleKeydown"
    />
    <NSpace justify="end">
      <NButton
        v-if="isStreaming"
        type="primary"
        :disabled="disabled"
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
        @click="handleSend"
      >
        <Send :size="16" style="margin-right: 6px" />
        发送
      </NButton>
    </NSpace>
  </NSpace>
</template>
