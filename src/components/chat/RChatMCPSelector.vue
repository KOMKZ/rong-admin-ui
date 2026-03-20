<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { MCPServerOption } from './types'

interface Props {
  visible: boolean
  options: MCPServerOption[]
  filterText: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [serverName: string]
  close: []
}>()

const listRef = ref<HTMLElement | null>(null)
const highlightIndex = ref(0)

const filtered = computed(() => {
  const q = props.filterText.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(
    (o) =>
      o.server_name.toLowerCase().includes(q) ||
      o.server_display_name.toLowerCase().includes(q),
  )
})

watch(
  () => [props.visible, props.filterText, props.options] as const,
  () => {
    highlightIndex.value = 0
  },
)

watch(highlightIndex, async () => {
  await nextTick()
  const el = listRef.value?.querySelector<HTMLElement>('[data-mcp-item="active"]')
  el?.scrollIntoView({ block: 'nearest' })
})

function confirmSelection() {
  const list = filtered.value
  if (list.length === 0) return
  const idx = Math.min(highlightIndex.value, list.length - 1)
  const opt = list[idx]
  if (opt) emit('select', opt.server_name)
}

/** @returns true if key was handled */
function handleParentKeydown(e: KeyboardEvent): boolean {
  if (!props.visible || filtered.value.length === 0) return false
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = Math.min(highlightIndex.value + 1, filtered.value.length - 1)
    return true
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(highlightIndex.value - 1, 0)
    return true
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    confirmSelection()
    return true
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
    return true
  }
  return false
}

defineExpose({ handleParentKeydown })
</script>

<template>
  <div v-show="visible && filtered.length > 0" class="r-chat-mcp-selector" role="listbox" aria-label="MCP 服务器">
    <div ref="listRef" class="r-chat-mcp-selector__scroll">
      <button
        v-for="(opt, idx) in filtered"
        :key="opt.server_name"
        type="button"
        class="r-chat-mcp-selector__item"
        :class="{ 'r-chat-mcp-selector__item--active': idx === highlightIndex }"
        :data-mcp-item="idx === highlightIndex ? 'active' : undefined"
        role="option"
        @mousedown.prevent
        @click="emit('select', opt.server_name)"
      >
        <span class="r-chat-mcp-selector__name">{{ opt.server_display_name }}</span>
        <span class="r-chat-mcp-selector__meta">{{ opt.server_name }}</span>
        <span class="r-chat-mcp-selector__count">{{ opt.tools?.length ?? 0 }} 工具</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.r-chat-mcp-selector {
  position: absolute;
  z-index: 10;
  left: 0;
  right: 0;
  bottom: 100%;
  margin-bottom: 6px;
  min-width: 280px;
  max-width: 100%;
  max-height: 240px;
  padding: 6px;
  background: var(--ra-color-bg-surface, #fff);
  border: 1px solid var(--ra-color-border-light, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06);
}
.r-chat-mcp-selector__scroll {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.r-chat-mcp-selector__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: var(--ra-color-text-primary, #1e293b);
  transition: background 0.12s ease;
}
.r-chat-mcp-selector__item:hover,
.r-chat-mcp-selector__item--active {
  background: var(--ra-color-bg-hover, #f1f5f9);
}
.r-chat-mcp-selector__name {
  font-weight: 600;
  font-size: 13px;
  flex: 1 1 auto;
  min-width: 0;
}
.r-chat-mcp-selector__meta {
  font-size: 11px;
  color: var(--ra-color-text-tertiary, #64748b);
  font-family: ui-monospace, monospace;
}
.r-chat-mcp-selector__count {
  font-size: 11px;
  color: var(--ra-color-text-secondary, #64748b);
  margin-left: auto;
}
</style>
