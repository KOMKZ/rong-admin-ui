<script lang="ts" setup>
import { computed, h, type VNode } from 'vue'
import type { IconSize, IconColor } from './types'
import { getIcon } from './icon-registry'

const props = withDefaults(
  defineProps<{
    name: string
    size?: IconSize
    color?: IconColor
    strokeWidth?: number
    class?: string
  }>(),
  {
    size: 'md',
    color: 'inherit',
    strokeWidth: 2,
    class: '',
  },
)

const sizeMap: Record<string, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
}

const colorMap: Record<string, string> = {
  inherit: 'currentColor',
  primary: 'var(--ra-color-text-primary)',
  secondary: 'var(--ra-color-text-secondary)',
  tertiary: 'var(--ra-color-text-tertiary)',
  brand: 'var(--ra-color-brand-primary)',
  success: 'var(--ra-color-success)',
  warning: 'var(--ra-color-warning)',
  danger: 'var(--ra-color-danger)',
  info: 'var(--ra-color-info)',
}

const computedSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  return sizeMap[props.size] ?? 20
})

const computedColor = computed(() => {
  if (props.color in colorMap) {
    return colorMap[props.color]
  }
  return props.color
})

const iconComponent = computed(() => getIcon(props.name))

const iconVNode = computed((): VNode | null => {
  if (!iconComponent.value) {
    return null
  }
  return h(iconComponent.value, {
    size: computedSize.value,
    strokeWidth: props.strokeWidth,
    color: computedColor.value,
    class: 'r-icon__svg',
    'aria-hidden': 'true',
  })
})
</script>

<template>
  <span
    class="r-icon"
    :class="[props.class]"
    :style="{
      '--r-icon-size': `${computedSize}px`,
      '--r-icon-color': computedColor,
    }"
    role="img"
    :aria-label="name"
    data-testid="r-icon"
  >
    <component :is="() => iconVNode" v-if="iconVNode" />
    <span v-else class="r-icon__fallback" :title="`Icon not found: ${name}`">?</span>
  </span>
</template>

<style scoped>
.r-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--r-icon-size);
  height: var(--r-icon-size);
  color: var(--r-icon-color);
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 1;
}

.r-icon :deep(.r-icon__svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.r-icon__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: calc(var(--r-icon-size) * 0.6);
  font-weight: 600;
  color: var(--ra-color-text-tertiary);
  background: var(--ra-color-bg-muted);
  border-radius: var(--ra-radius-sm);
}
</style>
