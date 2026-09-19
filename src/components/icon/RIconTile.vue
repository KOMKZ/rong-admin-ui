<script lang="ts" setup>
  // 能力图标瓦片：彩色底 + 语义色图形的图标容器原语。
  // 用于能力清单、流程节点、产物卡片等"一类能力一个识别色"的场景；
  // 颜色一律走语义 token（tone → -bg/-text），组件不硬编码色值、不写业务语义。
  import { computed } from 'vue'
  import RIcon from './RIcon.vue'
  import type { IconTileProps } from './types'

  const props = withDefaults(defineProps<IconTileProps>(), {
    tone: 'brand',
    size: 'md',
    strokeWidth: 2,
  })

  const sizeMap: Record<string, { tile: number; glyph: number }> = {
    sm: { tile: 24, glyph: 14 },
    md: { tile: 32, glyph: 18 },
    lg: { tile: 40, glyph: 22 },
  }

  const toneVars: Record<string, { bg: string; fg: string }> = {
    brand: {
      bg: 'var(--ra-color-brand-subtle)',
      fg: 'var(--ra-color-brand-primary)',
    },
    success: { bg: 'var(--ra-color-success-bg)', fg: 'var(--ra-color-success)' },
    warning: { bg: 'var(--ra-color-warning-bg)', fg: 'var(--ra-color-warning)' },
    danger: { bg: 'var(--ra-color-danger-bg)', fg: 'var(--ra-color-danger)' },
    info: { bg: 'var(--ra-color-info-bg)', fg: 'var(--ra-color-info-text)' },
    accent: { bg: 'var(--ra-color-accent-bg)', fg: 'var(--ra-color-accent)' },
    neutral: { bg: 'var(--ra-color-bg-page)', fg: 'var(--ra-color-text-secondary)' },
  }

  const dims = computed(
    () => sizeMap[props.size] ?? { tile: props.size as number, glyph: Math.round((props.size as number) * 0.56) },
  )
  const tone = computed(() => toneVars[props.tone] ?? toneVars.brand)
</script>

<template>
  <span
    class="r-icon-tile"
    :style="{
      '--r-icon-tile-size': `${dims.tile}px`,
      '--r-icon-tile-bg': tone.bg,
      '--r-icon-tile-fg': tone.fg,
    }"
    data-testid="r-icon-tile"
  >
    <RIcon :name="props.icon" :size="dims.glyph" :stroke-width="props.strokeWidth" color="inherit" />
  </span>
</template>

<style scoped>
  .r-icon-tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--r-icon-tile-size);
    height: var(--r-icon-tile-size);
    flex-shrink: 0;
    color: var(--r-icon-tile-fg);
    background: var(--r-icon-tile-bg);
    border-radius: var(--ra-radius-md);
  }
</style>
