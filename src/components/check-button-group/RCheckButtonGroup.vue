<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import { RIcon } from '../icon'
import type { CheckButtonOption } from './types'

const props = defineProps({
  options: { type: Array as PropType<CheckButtonOption[]>, required: true },
  modelValue: {
    type: [Array, String, Number, null] as PropType<(string | number)[] | string | number | null>,
    default: null,
  },
  multiple: { type: Boolean, default: false },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[] | string | number | null]
  change: [value: (string | number)[] | string | number | null]
}>()

const selectedSet = computed(() => {
  if (props.modelValue == null) return new Set<string | number>()
  if (Array.isArray(props.modelValue)) return new Set(props.modelValue)
  return new Set([props.modelValue])
})

function isChecked(value: string | number): boolean {
  return selectedSet.value.has(value)
}

function toggle(value: string | number): void {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const idx = current.indexOf(value)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(value)
    emit('update:modelValue', current)
    emit('change', current)
  } else {
    const next = props.modelValue === value ? null : value
    emit('update:modelValue', next)
    emit('change', next)
  }
}

defineExpose({
  selectAll: () => {
    if (!props.multiple) return
    const all = props.options.filter((o) => !o.disabled).map((o) => o.value)
    emit('update:modelValue', all)
    emit('change', all)
  },
  clearAll: () => {
    emit('update:modelValue', props.multiple ? [] : null)
    emit('change', props.multiple ? [] : null)
  },
  getSelected: () => {
    if (props.modelValue == null) return []
    return Array.isArray(props.modelValue) ? [...props.modelValue] : [props.modelValue]
  },
})
</script>

<template>
  <div
    class="r-check-button-group"
    :class="[`r-check-button-group--${size}`, { 'r-check-button-group--block': block }]"
    role="group"
    data-testid="check-button-group"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="r-check-button"
      :class="{
        'r-check-button--checked': isChecked(opt.value),
        'r-check-button--disabled': disabled || opt.disabled,
      }"
      :disabled="disabled || opt.disabled"
      :aria-pressed="isChecked(opt.value)"
      :data-testid="`check-button-${opt.value}`"
      @click="toggle(opt.value)"
    >
      <RIcon v-if="opt.icon" :name="opt.icon" size="sm" class="r-check-button__icon" />
      <span class="r-check-button__label">{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.r-check-button-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ra-spacing-2);
}
.r-check-button-group--block {
  display: flex;
  width: 100%;
}
.r-check-button-group--block .r-check-button {
  flex: 1;
}
.r-check-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-1);
  padding: var(--ra-spacing-1-5) var(--ra-spacing-3);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--ra-transition-fast);
  outline: none;
  white-space: nowrap;
}
.r-check-button:hover:not(:disabled) {
  border-color: var(--ra-color-brand-primary);
  color: var(--ra-color-brand-primary);
}
.r-check-button:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}
.r-check-button--checked {
  border-color: var(--ra-color-brand-primary);
  background: var(--ra-color-brand-primary);
  color: white;
}
.r-check-button--checked:hover:not(:disabled) {
  background: var(--ra-color-brand-hover);
  color: white;
}
.r-check-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.r-check-button__icon {
  flex-shrink: 0;
}
.r-check-button-group--small .r-check-button {
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
  font-size: var(--ra-font-size-xs);
}
.r-check-button-group--large .r-check-button {
  padding: var(--ra-spacing-2) var(--ra-spacing-4);
  font-size: var(--ra-font-size-base);
}
</style>
