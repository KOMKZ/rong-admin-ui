<script lang="ts" setup>
import { ref, computed, watch } from 'vue'

interface TocItem {
  level: number
  text: string
  id: string
}

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  (e: 'scroll-to', id: string): void
}>()

const maxLevel = ref(3)
const activeId = ref('')

const tocList = computed<TocItem[]>(() => {
  if (!props.content) return []
  const lines = props.content.split('\n')
  const toc: TocItem[] = []
  let inCodeBlock = false

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; return }
    if (inCodeBlock) return
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = `heading-${index}-${text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')}`
      toc.push({ level, text, id })
    }
  })
  return toc
})

const filteredToc = computed(() => tocList.value.filter((item) => item.level <= maxLevel.value))

const LEVEL_ICONS = ['●', '○', '◆', '◇', '▪', '▫']

function scrollToHeading(item: TocItem) {
  activeId.value = item.id
  emit('scroll-to', item.id)
  setTimeout(() => {
    const body = document.querySelector('.markdown-body')
    if (!body) return
    const headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6')
    for (const h of headings) {
      if (h.textContent?.trim() === item.text) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
    }
  }, 100)
}

watch(() => props.content, () => { activeId.value = '' })
</script>

<template>
  <div class="rmd-toc">
    <div class="rmd-toc__controls">
      <span class="rmd-toc__label">显示层级</span>
      <input
        v-model.number="maxLevel"
        type="range"
        class="rmd-toc__slider"
        min="1"
        max="6"
        step="1"
      />
      <span class="rmd-toc__level-value">H{{ maxLevel }}</span>
    </div>

    <div class="rmd-toc__sep" />

    <div v-if="filteredToc.length > 0" class="rmd-toc__list">
      <div
        v-for="(item, index) in filteredToc"
        :key="index"
        class="rmd-toc__item"
        :class="[`rmd-toc__item--level-${item.level}`, { 'rmd-toc__item--active': activeId === item.id }]"
        :style="{ paddingLeft: `${(item.level - 1) * 16}px` }"
        @click="scrollToHeading(item)"
      >
        <span class="rmd-toc__bullet">{{ LEVEL_ICONS[item.level - 1] || '·' }}</span>
        <span class="rmd-toc__text">{{ item.text }}</span>
      </div>
    </div>
    <div v-else class="rmd-toc__empty">暂无标题</div>
  </div>
</template>

<style>
.rmd-toc { padding: 16px; }

.rmd-toc__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rmd-toc__label {
  font-size: 13px;
  color: var(--ra-color-text-tertiary, #656d76);
  white-space: nowrap;
}

.rmd-toc__slider {
  width: 120px;
  accent-color: var(--ra-color-brand-primary, #0969da);
}

.rmd-toc__level-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--ra-color-text-primary, #24292f);
  min-width: 24px;
}

.rmd-toc__sep {
  height: 1px;
  background: var(--ra-color-border-light, #e5e7eb);
  margin: 12px 0;
}

.rmd-toc__list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.rmd-toc__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: var(--ra-radius-md, 6px);
  transition: all 0.15s;
  font-size: 14px;
  line-height: 1.5;
}

.rmd-toc__item:hover {
  background: var(--ra-color-bg-muted, rgba(24, 160, 88, 0.08));
}

.rmd-toc__item--active {
  background: var(--ra-color-brand-subtle, rgba(9, 105, 218, 0.1));
  color: var(--ra-color-brand-primary, #0969da);
  font-weight: 500;
}

.rmd-toc__bullet {
  flex-shrink: 0;
  width: 12px;
  text-align: center;
  color: var(--ra-color-text-quaternary, #999);
  font-size: 10px;
  line-height: 21px;
}

.rmd-toc__text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rmd-toc__item--level-1 { font-weight: 600; font-size: 15px; }
.rmd-toc__item--level-2 { font-weight: 500; }
.rmd-toc__item--level-3 { color: var(--ra-color-text-secondary, #666); }
.rmd-toc__item--level-4,
.rmd-toc__item--level-5,
.rmd-toc__item--level-6 { color: var(--ra-color-text-tertiary, #888); font-size: 13px; }

.rmd-toc__empty {
  color: var(--ra-color-text-quaternary, #8c959f);
  font-size: 13px;
  padding: 12px 0;
  text-align: center;
}
</style>
