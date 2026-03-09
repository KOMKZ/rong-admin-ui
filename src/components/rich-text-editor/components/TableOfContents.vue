<script lang="ts" setup>
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps(nodeViewProps)

interface TocItem {
  level: number
  text: string
  pos: number
}

const items = ref<TocItem[]>([])

function updateToc() {
  const editor = props.editor
  if (!editor) return
  const newItems: TocItem[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      newItems.push({ level: node.attrs.level, text: node.textContent, pos })
    }
  })
  items.value = newItems
}

function scrollToHeading(pos: number) {
  const editor = props.editor
  if (!editor) return
  editor
    .chain()
    .focus()
    .setTextSelection({ from: pos + 1, to: pos + 1 })
    .scrollIntoView()
    .run()
  const domNode = editor.view.nodeDOM(pos) as HTMLElement | null
  domNode?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  updateToc()
  props.editor.on('update', updateToc)
})

onUnmounted(() => {
  props.editor.off('update', updateToc)
})
</script>

<template>
  <NodeViewWrapper class="rte-toc">
    <div class="rte-toc__header">目录</div>
    <ul v-if="items.length > 0" class="rte-toc__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="rte-toc__item"
        :style="{ paddingLeft: `${(item.level - 1) * 1.2}em` }"
        @click="scrollToHeading(item.pos)"
      >
        {{ item.text }}
      </li>
    </ul>
    <div v-else class="rte-toc__empty">文档中暂无标题...</div>
  </NodeViewWrapper>
</template>

<style>
.rte-toc {
  padding: 16px;
  margin: 16px 0;
  background: var(--ra-color-bg-muted, #f6f8fa);
  border: 1px solid var(--ra-color-border-light, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  user-select: none;
}

.rte-toc__header {
  font-weight: 600;
  font-size: 16px;
  color: var(--ra-color-text-primary, #24292f);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--ra-color-border-light, #e5e7eb);
}

.rte-toc__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rte-toc__item {
  padding: 4px 0;
  font-size: 14px;
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: color 0.15s ease;
  border-radius: var(--ra-radius-sm, 3px);
}

.rte-toc__item:hover {
  color: var(--ra-color-brand-primary, #0969da);
}

.rte-toc__empty {
  color: var(--ra-color-text-quaternary, #8c959f);
  font-style: italic;
  font-size: 14px;
  padding: 8px 0;
}
</style>
