<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import { RIcon } from '../icon'
import type { CheckCardOption } from './types'

const props = defineProps({
  options: { type: Array as PropType<CheckCardOption[]>, required: true },
  modelValue: {
    type: [Array, String, Number, null] as PropType<(string | number)[] | string | number | null>,
    default: null,
  },
  multiple: { type: Boolean, default: false },
  columns: { type: [Number, String] as PropType<number | 'auto'>, default: 'auto' },
  cardMinWidth: { type: Number, default: 200 },
  gap: { type: Number, default: 12 },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
  disabled: { type: Boolean, default: false },
  bordered: { type: Boolean, default: true },
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

function isOptionDisabled(opt: CheckCardOption): boolean {
  return props.disabled || !!opt.disabled
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

const gridStyle = computed(() => {
  if (typeof props.columns === 'number') {
    return { gridTemplateColumns: `repeat(${props.columns}, 1fr)`, gap: `${props.gap}px` }
  }
  return {
    gridTemplateColumns: `repeat(auto-fill, minmax(${props.cardMinWidth}px, 1fr))`,
    gap: `${props.gap}px`,
  }
})

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
    class="r-check-card-group"
    :class="[`r-check-card-group--${size}`]"
    :style="gridStyle"
    role="group"
    data-testid="check-card-group"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="r-check-card"
      :class="{
        'r-check-card--checked': isChecked(opt.value),
        'r-check-card--disabled': isOptionDisabled(opt),
        'r-check-card--bordered': bordered,
      }"
      :disabled="isOptionDisabled(opt)"
      :aria-pressed="isChecked(opt.value)"
      :data-testid="`check-card-${opt.value}`"
      @click="toggle(opt.value)"
    >
      <div v-if="opt.icon" class="r-check-card__icon">
        <RIcon :name="opt.icon" size="lg" />
      </div>
      <div class="r-check-card__content">
        <div class="r-check-card__title">{{ opt.title }}</div>
        <div v-if="opt.description" class="r-check-card__desc">{{ opt.description }}</div>
        <div v-if="opt.extra" class="r-check-card__extra">{{ opt.extra }}</div>
      </div>
      <div v-if="opt.tag" class="r-check-card__tag">
        <span
          class="r-check-card__tag-text"
          :class="opt.tagType ? `r-check-card__tag-text--${opt.tagType}` : ''"
        >
          {{ opt.tag }}
        </span>
      </div>
      <div
        class="r-check-card__check-mark"
        :class="{ 'r-check-card__check-mark--active': isChecked(opt.value) }"
      >
        <RIcon name="check" size="xs" />
      </div>
    </button>
  </div>
</template>

<style scoped>
.r-check-card-group {
  display: grid;
}
.r-check-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
  padding: var(--ra-spacing-4);
  border: 2px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-lg);
  background: var(--ra-color-bg-surface);
  cursor: pointer;
  text-align: left;
  transition: all var(--ra-transition-fast);
  outline: none;
  font-family: inherit;
}
.r-check-card:hover:not(:disabled) {
  border-color: var(--ra-color-brand-primary);
  box-shadow: var(--ra-shadow-sm);
}
.r-check-card:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}
.r-check-card--checked {
  border-color: var(--ra-color-brand-primary);
  background: var(--ra-color-brand-light, rgba(32, 128, 240, 0.06));
}
.r-check-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.r-check-card__icon {
  color: var(--ra-color-text-secondary);
}
.r-check-card--checked .r-check-card__icon {
  color: var(--ra-color-brand-primary);
}
.r-check-card__title {
  font-size: var(--ra-font-size-base);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
}
.r-check-card__desc {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-secondary);
  line-height: var(--ra-line-height-relaxed);
}
.r-check-card__extra {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
}
.r-check-card__tag {
  position: absolute;
  top: var(--ra-spacing-2);
  right: var(--ra-spacing-2);
}
.r-check-card__tag-text {
  font-size: var(--ra-font-size-xs);
  padding: 1px var(--ra-spacing-1);
  border-radius: var(--ra-radius-sm);
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-secondary);
}
.r-check-card__tag-text--success {
  background: var(--ra-color-success-bg);
  color: var(--ra-color-success-text);
}
.r-check-card__tag-text--warning {
  background: var(--ra-color-warning-bg);
  color: var(--ra-color-warning-text);
}
.r-check-card__tag-text--error {
  background: var(--ra-color-danger-bg);
  color: var(--ra-color-danger-text);
}
.r-check-card__tag-text--info {
  background: var(--ra-color-brand-light, #e8f4ff);
  color: var(--ra-color-brand-primary);
}
.r-check-card__check-mark {
  position: absolute;
  bottom: var(--ra-spacing-2);
  right: var(--ra-spacing-2);
  width: 20px;
  height: 20px;
  border-radius: var(--ra-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ra-color-bg-muted);
  color: transparent;
  transition: all var(--ra-transition-fast);
}
.r-check-card__check-mark--active {
  background: var(--ra-color-brand-primary);
  color: white;
}
.r-check-card-group--small .r-check-card {
  padding: var(--ra-spacing-3);
}
.r-check-card-group--large .r-check-card {
  padding: var(--ra-spacing-5);
}
</style>
