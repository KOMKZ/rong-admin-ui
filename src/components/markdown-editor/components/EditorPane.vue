<script lang="ts" setup>
withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    readonly?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '在此输入 Markdown 内容...',
    readonly: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const target = e.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    const value = target.value
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    emit('update:modelValue', newValue)
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + 2
    })
  }
}
</script>

<template>
  <div class="rme-editor-pane" data-testid="markdown-editor-pane">
    <textarea
      class="rme-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      spellcheck="false"
      data-testid="markdown-editor-textarea"
      @input="handleInput"
      @keydown="handleKeydown"
    />
  </div>
</template>

<style scoped>
.rme-editor-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rme-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  padding: 16px;
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ra-color-text-primary, #24292f);
  background: var(--ra-color-bg-surface, #fff);
  tab-size: 2;
}

.rme-textarea::placeholder {
  color: var(--ra-color-text-quaternary, #8c959f);
}

.rme-textarea:focus {
  outline: none;
}
</style>
