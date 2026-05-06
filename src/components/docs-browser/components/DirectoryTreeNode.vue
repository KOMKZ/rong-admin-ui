<template>
  <div class="r-docs-dir-tree">
    <div
      class="r-docs-dir-item"
      :class="{ 'is-active': activeDir === scopeKey }"
      :data-testid="testId"
      :style="{ paddingLeft }"
    >
      <button
        v-if="hasChildren"
        class="r-docs-dir-toggle"
        type="button"
        :aria-label="isExpanded ? '收起目录' : '展开目录'"
        @click="$emit('toggle', scopeKey)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline :points="isExpanded ? '6 9 12 15 18 9' : '9 6 15 12 9 18'" />
        </svg>
      </button>
      <span v-else class="r-docs-dir-toggle r-docs-dir-toggle--placeholder"></span>

      <button class="r-docs-dir-select" type="button" @click="$emit('select', scopeKey)">
        <span class="r-docs-dir-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span class="r-docs-dir-name">
          <template v-if="highlightParts.length">
            <template v-for="(part, index) in highlightParts" :key="`${scopeKey}-${index}`">
              <mark v-if="part.highlight" class="r-docs-dir-highlight">{{ part.text }}</mark>
              <template v-else>{{ part.text }}</template>
            </template>
          </template>
          <template v-else>{{ node.name }}</template>
        </span>
        <span class="r-docs-dir-badge">{{ node.file_count }}</span>
      </button>
    </div>

    <template v-if="hasChildren && isExpanded">
      <DirectoryTreeNode
        v-for="child in node.children"
        :key="buildScopeKey(child)"
        :node="child"
        :level="level + 1"
        :active-dir="activeDir"
        :expanded-keys="expandedKeys"
        :build-scope-key="buildScopeKey"
        :force-expanded="forceExpanded"
        :highlight-keyword="highlightKeyword"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { DocDirectory } from '../types'

defineOptions({ name: 'DirectoryTreeNode' })

const props = defineProps<{
  node: DocDirectory
  level: number
  activeDir: string
  expandedKeys: Set<string>
  buildScopeKey: (dir: DocDirectory) => string
  forceExpanded?: boolean
  highlightKeyword?: string
}>()

defineEmits<{
  (e: 'select', dir: string): void
  (e: 'toggle', dir: string): void
}>()

const scopeKey = computed(() => props.buildScopeKey(props.node))
const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0)
const isExpanded = computed(() => props.forceExpanded || props.expandedKeys.has(scopeKey.value))
const testId = computed(() => `docs-dir-${scopeKey.value.replace(/[^a-zA-Z0-9_-]/g, '-')}`)
const paddingLeft = computed(() => `${12 + 16 * props.level}px`)
const highlightParts = computed(() => splitHighlightParts(props.node.name, props.highlightKeyword ?? ''))

function splitHighlightParts(text: string, keyword: string): Array<{ text: string; highlight: boolean }> {
  if (!keyword) {
    return []
  }

  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const parts: Array<{ text: string; highlight: boolean }> = []
  let cursor = 0

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerKeyword, cursor)
    if (matchIndex < 0) {
      parts.push({ text: text.slice(cursor), highlight: false })
      break
    }
    if (matchIndex > cursor) {
      parts.push({ text: text.slice(cursor, matchIndex), highlight: false })
    }
    parts.push({ text: text.slice(matchIndex, matchIndex + keyword.length), highlight: true })
    cursor = matchIndex + keyword.length
  }

  return parts
}
</script>
