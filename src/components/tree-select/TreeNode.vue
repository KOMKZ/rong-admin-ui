<template>
  <div class="r-tree-node" :style="{ '--depth': depth }">
    <div
      class="r-tree-node__row"
      :class="{
        'r-tree-node__row--selected': node.id === selectedId,
        'r-tree-node__row--disabled': node.disabled,
      }"
      role="treeitem"
      tabindex="-1"
      :aria-expanded="hasChildren ? isExpanded : undefined"
      :aria-selected="node.id === selectedId"
      :aria-disabled="node.disabled"
      :data-testid="`r-tree-node-${node.id}`"
      @click="handleClick"
      @keydown="handleKeydown"
    >
      <!-- Indent -->
      <span class="r-tree-node__indent" :style="{ width: `${depth * 20}px` }" />

      <!-- Expand toggle -->
      <span
        v-if="hasChildren"
        class="r-tree-node__toggle"
        @click.stop="emit('toggle', node.id)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </span>
      <span v-else class="r-tree-node__toggle-placeholder" />

      <!-- Icon -->
      <span v-if="$slots.icon" class="r-tree-node__icon">
        <slot name="icon" :node="node" :expanded="isExpanded" />
      </span>
      <span v-else class="r-tree-node__icon">
        <svg
          v-if="hasChildren"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <template v-if="isExpanded">
            <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1" />
            <path d="M20 19H8a2 2 0 0 1-2-2V9h12a2 2 0 0 1 2 2z" />
          </template>
          <template v-else>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </template>
        </svg>
        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </span>

      <!-- Label -->
      <span class="r-tree-node__label">
        <slot name="label" :node="node" :depth="depth">
          <!-- eslint-disable-next-line vue/no-v-html -- content is escaped via escapeHtml -->
          <span v-if="keyword" v-html="highlightLabel(node.label, keyword)" />
          <span v-else>{{ node.label }}</span>
        </slot>
      </span>
    </div>

    <!-- Children -->
    <Transition name="r-tree-node-expand">
      <div v-if="hasChildren && isExpanded" class="r-tree-node__children">
        <TreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :expanded-keys="expandedKeys"
          :selected-id="selectedId"
          :keyword="keyword"
          @select="emit('select', $event)"
          @toggle="emit('toggle', $event)"
        >
          <template v-if="$slots.label" #label="labelProps: { node: TreeSelectNode; depth: number }">
            <slot name="label" v-bind="labelProps" />
          </template>
          <template v-if="$slots.icon" #icon="iconProps: { node: TreeSelectNode; expanded: boolean }">
            <slot name="icon" v-bind="iconProps" />
          </template>
        </TreeNode>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TreeSelectNode } from './types'

const props = defineProps<{
  node: TreeSelectNode
  depth: number
  expandedKeys: Set<string | number>
  selectedId: string | number | null
  keyword?: string
}>()

const emit = defineEmits<{
  select: [node: TreeSelectNode]
  toggle: [id: string | number]
}>()

const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0)
const isExpanded = computed(() => props.expandedKeys.has(props.node.id))

function handleClick(): void {
  if (props.node.disabled) return
  if (hasChildren.value) {
    emit('toggle', props.node.id)
  }
  emit('select', props.node)
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleClick()
  } else if (e.key === 'ArrowRight' && hasChildren.value && !isExpanded.value) {
    e.preventDefault()
    emit('toggle', props.node.id)
  } else if (e.key === 'ArrowLeft' && hasChildren.value && isExpanded.value) {
    e.preventDefault()
    emit('toggle', props.node.id)
  }
}

function highlightLabel(label: string, kw: string): string {
  if (!kw) return label
  const idx = label.toLowerCase().indexOf(kw.toLowerCase())
  if (idx === -1) return label
  const before = label.slice(0, idx)
  const match = label.slice(idx, idx + kw.length)
  const after = label.slice(idx + kw.length)
  return `${escapeHtml(before)}<mark class="r-tree-node__highlight">${escapeHtml(match)}</mark>${escapeHtml(after)}`
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[m] ?? m
  })
}
</script>

<style>
.r-tree-node__row {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: var(--ra-radius-sm);
  margin: 1px 4px;
  transition: background var(--ra-transition-fast);
  outline: none;
  min-height: 32px;
}

.r-tree-node__row:hover {
  background: var(--ra-color-bg-hover);
}

.r-tree-node__row--selected {
  background: color-mix(in srgb, var(--ra-color-brand-primary) 10%, transparent);
  color: var(--ra-color-brand-primary);
}

.r-tree-node__row--selected:hover {
  background: color-mix(in srgb, var(--ra-color-brand-primary) 15%, transparent);
}

.r-tree-node__row--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.r-tree-node__row:focus-visible {
  outline: 2px solid var(--ra-color-border-focus);
  outline-offset: -2px;
}

.r-tree-node__indent {
  flex-shrink: 0;
}

.r-tree-node__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--ra-color-text-tertiary);
  border-radius: var(--ra-radius-sm);
  transition: color var(--ra-transition-fast);
  cursor: pointer;
}

.r-tree-node__toggle:hover {
  color: var(--ra-color-text-primary);
}

.r-tree-node__toggle svg {
  transition: transform var(--ra-transition-fast);
}

.r-tree-node__toggle-placeholder {
  width: 20px;
  flex-shrink: 0;
}

.r-tree-node__icon {
  display: flex;
  align-items: center;
  margin-right: 6px;
  color: var(--ra-color-text-secondary);
  flex-shrink: 0;
}

.r-tree-node__row--selected .r-tree-node__icon {
  color: var(--ra-color-brand-primary);
}

.r-tree-node__label {
  flex: 1;
  font-size: var(--ra-font-size-sm);
  line-height: var(--ra-line-height-tight, 1.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-tree-node__highlight {
  background: color-mix(in srgb, var(--ra-color-warning) 25%, transparent);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

/* ─── Expand animation ─── */

.r-tree-node-expand-enter-active,
.r-tree-node-expand-leave-active {
  transition: all var(--ra-transition-fast);
  overflow: hidden;
}

.r-tree-node-expand-enter-from,
.r-tree-node-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.r-tree-node-expand-enter-to,
.r-tree-node-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
