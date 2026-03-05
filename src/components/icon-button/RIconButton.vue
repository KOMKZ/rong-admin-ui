<script lang="ts" setup>
import type { PropType } from 'vue'
import { NButton, NTooltip } from 'naive-ui'
import { RIcon } from '../icon'

const props = defineProps({
  icon: { type: String, required: true },
  tooltip: { type: String, default: '' },
  size: { type: String as PropType<'tiny' | 'small' | 'medium' | 'large'>, default: 'small' },
  type: {
    type: String as PropType<'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'>,
    default: 'default',
  },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  circle: { type: Boolean, default: true },
  ghost: { type: Boolean, default: false },
  dashed: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

function handleClick(e: MouseEvent): void {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<template>
  <NTooltip v-if="tooltip" :disabled="!tooltip">
    <template #trigger>
      <NButton
        :size="size"
        :type="danger ? 'error' : type"
        :circle="circle"
        :ghost="ghost"
        :dashed="dashed"
        :loading="loading"
        :disabled="disabled"
        :aria-label="ariaLabel || tooltip || icon"
        class="r-icon-button"
        data-testid="icon-button"
        @click="handleClick"
      >
        <template #icon>
          <RIcon :name="icon" :size="size === 'tiny' ? 'xs' : size === 'small' ? 'sm' : 'md'" />
        </template>
      </NButton>
    </template>
    {{ tooltip }}
  </NTooltip>
  <NButton
    v-else
    :size="size"
    :type="danger ? 'error' : type"
    :circle="circle"
    :ghost="ghost"
    :dashed="dashed"
    :loading="loading"
    :disabled="disabled"
    :aria-label="ariaLabel || icon"
    class="r-icon-button"
    data-testid="icon-button"
    @click="handleClick"
  >
    <template #icon>
      <RIcon :name="icon" :size="size === 'tiny' ? 'xs' : size === 'small' ? 'sm' : 'md'" />
    </template>
  </NButton>
</template>

<style scoped>
.r-icon-button {
  transition: all var(--ra-transition-fast);
}
</style>
