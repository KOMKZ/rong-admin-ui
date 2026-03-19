<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NSpace } from 'naive-ui'

interface Props {
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  maxLength?: number
}

interface Emits {
  (e: 'send', content: string): void
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
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

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
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
        type="primary"
        :disabled="!content.trim() || disabled"
        :loading="loading"
        @click="handleSend"
      >
        发送
      </NButton>
    </NSpace>
  </NSpace>
</template>
