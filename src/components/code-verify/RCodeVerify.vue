<script lang="ts" setup>
import { ref, onUnmounted, type PropType } from 'vue'
import { NInput, NButton } from 'naive-ui'

const codeInputRef = ref<InstanceType<typeof NInput> | null>(null)

const props = defineProps({
  modelValue: { type: String, required: true },
  codeLength: { type: Number, default: 6 },
  countdown: { type: Number, default: 60 },
  sendLabel: { type: String, default: '获取验证码' },
  sendingLabel: { type: String, default: '发送中...' },
  resendLabel: { type: String, default: '重新获取' },
  placeholder: { type: String, default: '请输入验证码' },
  disabled: { type: Boolean, default: false },
  sending: { type: Boolean, default: false },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
  inputWidth: { type: [Number, String], default: undefined },
  autoFocus: { type: Boolean, default: false },
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: []
  complete: [code: string]
}>()

const remaining = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function startCountdown(): void {
  stopTimer()
  remaining.value = props.countdown
  timer = setInterval(() => {
    remaining.value--
    if (remaining.value <= 0) {
      stopTimer()
    }
  }, 1000)
}

function stopTimer(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (remaining.value < 0) remaining.value = 0
}

function resetCountdown(): void {
  stopTimer()
  remaining.value = 0
}

onUnmounted(() => {
  stopTimer()
})

function handleSend(): void {
  if (remaining.value > 0 || props.sending || props.disabled) return
  emit('send')
  startCountdown()
}

function handleInput(value: string): void {
  const trimmed = value.slice(0, props.codeLength)
  emit('update:modelValue', trimmed)
  if (trimmed.length === props.codeLength) {
    emit('complete', trimmed)
  }
}

const inputStyle = props.inputWidth
  ? { width: typeof props.inputWidth === 'number' ? `${props.inputWidth}px` : props.inputWidth }
  : undefined

defineExpose({
  startCountdown,
  resetCountdown,
  focus: () => {
    codeInputRef.value?.focus()
  },
  clear: () => emit('update:modelValue', ''),
  getRemaining: () => remaining.value,
})
</script>

<template>
  <div class="r-code-verify" data-testid="code-verify">
    <NInput
      ref="codeInputRef"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      :maxlength="codeLength"
      :style="inputStyle"
      :autofocus="autoFocus"
      data-testid="code-input"
      @update:value="handleInput"
    >
      <template #suffix>
        <NButton
          :size="size"
          :disabled="disabled || sending || remaining > 0"
          :loading="sending"
          text
          type="primary"
          class="r-code-verify__send-btn"
          data-testid="code-send-btn"
          @click="handleSend"
        >
          <template v-if="sending">{{ sendingLabel }}</template>
          <template v-else-if="remaining > 0">{{ resendLabel }}({{ remaining }}s)</template>
          <template v-else>{{ sendLabel }}</template>
        </NButton>
      </template>
    </NInput>
  </div>
</template>

<style scoped>
.r-code-verify {
  display: inline-flex;
  align-items: center;
}
.r-code-verify__send-btn {
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
