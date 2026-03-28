<template>
  <div class="r-docs-highlight-toolbar" data-testid="highlight-toolbar">
    <button
      class="r-docs-toolbar-btn"
      :class="{ 'r-docs-toolbar-btn--active': highlightMode }"
      :title="highlightMode ? '关闭笔刷' : '开启笔刷'"
      data-testid="highlight-toggle"
      @click="$emit('toggle-mode')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      <span>{{ highlightMode ? '笔刷开' : '笔刷' }}</span>
    </button>

    <template v-if="highlightMode">
      <div class="r-docs-highlight-colors" data-testid="highlight-colors">
        <button
          v-for="color in colors"
          :key="color"
          class="r-docs-highlight-color-btn"
          :class="{ 'is-active': activeColor === color }"
          :style="{ background: colorMap[color] }"
          :title="color"
          :data-testid="`highlight-color-${color}`"
          @click="$emit('select-color', color)"
        ></button>
      </div>
    </template>

    <div class="r-docs-toolbar-divider"></div>

    <button
      class="r-docs-toolbar-btn"
      :class="{ 'r-docs-toolbar-btn--active': panelVisible }"
      title="高亮笔记面板"
      data-testid="highlight-panel-toggle"
      @click="$emit('toggle-panel')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span v-if="highlightCount > 0">笔记 ({{ highlightCount }})</span>
      <span v-else>笔记</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { HighlightColor } from '../types'

defineProps<{
  highlightMode: boolean
  activeColor: HighlightColor
  panelVisible: boolean
  highlightCount: number
  colors: HighlightColor[]
  colorMap: Record<HighlightColor, string>
}>()

defineEmits<{
  (e: 'toggle-mode'): void
  (e: 'select-color', color: HighlightColor): void
  (e: 'toggle-panel'): void
}>()
</script>

<style>
.r-docs-highlight-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.r-docs-toolbar-btn--active {
  background: var(--ra-color-primary-subtle, #eff6ff) !important;
  color: var(--ra-color-primary, #2563eb) !important;
  border-color: var(--ra-color-primary, #2563eb) !important;
}

.r-docs-highlight-colors {
  display: flex;
  align-items: center;
  gap: 4px;
}

.r-docs-highlight-color-btn {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}

.r-docs-highlight-color-btn:hover {
  transform: scale(1.15);
}

.r-docs-highlight-color-btn.is-active {
  border-color: var(--ra-color-text-primary, #111827);
  box-shadow: 0 0 0 2px var(--ra-color-surface, #fff);
}
</style>
