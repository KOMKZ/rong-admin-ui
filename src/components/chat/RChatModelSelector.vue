<script setup lang="ts">
import { NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'

interface Props {
  modelValue: string
  options: SelectOption[]
  disabled?: boolean
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: '选择模型',
})
defineEmits<Emits>()
</script>

<template>
  <NSelect
    :value="modelValue"
    :options="options"
    :disabled="disabled"
    :placeholder="placeholder"
    filterable
    @update:value="$emit('update:modelValue', $event)"
  />
</template>
