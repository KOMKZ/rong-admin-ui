<script lang="ts" setup>
import { ref, nextTick, onMounted, onUnmounted, type PropType } from 'vue'
import type { TabItem } from './types'

const props = defineProps({
  tabs: { type: Array as PropType<TabItem[]>, required: true },
  activeKey: { type: String, default: '' },
  showContextMenu: { type: Boolean, default: true },
})

const emit = defineEmits<{
  select: [key: string]
  close: [key: string]
  'close-other': [key: string]
  'close-all': []
}>()

const scrollRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const ctxVisible = ref(false)
const ctxPos = ref({ x: 0, y: 0 })
const ctxTabKey = ref('')

function updateScrollState(): void {
  const el = scrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollBy(delta: number): void {
  scrollRef.value?.scrollBy({ left: delta, behavior: 'smooth' })
}

function scrollToActive(): void {
  nextTick(() => {
    const el = scrollRef.value
    if (!el) return
    const active = el.querySelector('.r-tabs-view__tab--active') as HTMLElement | null
    if (active) {
      active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    }
    updateScrollState()
  })
}

function onContextMenu(e: MouseEvent, key: string): void {
  if (!props.showContextMenu) return
  e.preventDefault()
  ctxTabKey.value = key
  ctxPos.value = { x: e.clientX, y: e.clientY }
  ctxVisible.value = true
}

function closeCtx(): void {
  ctxVisible.value = false
}

function ctxCloseOther(): void {
  emit('close-other', ctxTabKey.value)
  closeCtx()
}

function ctxCloseAll(): void {
  emit('close-all')
  closeCtx()
}

function ctxCloseSelf(): void {
  emit('close', ctxTabKey.value)
  closeCtx()
}

function onDocClick(): void {
  if (ctxVisible.value) closeCtx()
}

onMounted(() => {
  updateScrollState()
  scrollRef.value?.addEventListener('scroll', updateScrollState, { passive: true })
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  scrollRef.value?.removeEventListener('scroll', updateScrollState)
  document.removeEventListener('click', onDocClick)
})

defineExpose({ scrollToActive })
</script>

<template>
  <div class="r-tabs-view" data-testid="tabs-view" role="tablist">
    <button
      v-if="canScrollLeft"
      class="r-tabs-view__arrow r-tabs-view__arrow--left"
      aria-label="Scroll tabs left"
      @click="scrollBy(-120)"
    >
      &#8249;
    </button>

    <div ref="scrollRef" class="r-tabs-view__scroll">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="r-tabs-view__tab"
        :class="{ 'r-tabs-view__tab--active': tab.key === activeKey }"
        role="tab"
        :aria-selected="tab.key === activeKey"
        :tabindex="tab.key === activeKey ? 0 : -1"
        @click="emit('select', tab.key)"
        @contextmenu="onContextMenu($event, tab.key)"
      >
        <span class="r-tabs-view__label">{{ tab.label }}</span>
        <button
          v-if="tab.closable !== false && !tab.affix"
          class="r-tabs-view__close"
          aria-label="Close tab"
          tabindex="-1"
          @click.stop="emit('close', tab.key)"
        >
          &times;
        </button>
      </button>
    </div>

    <button
      v-if="canScrollRight"
      class="r-tabs-view__arrow r-tabs-view__arrow--right"
      aria-label="Scroll tabs right"
      @click="scrollBy(120)"
    >
      &#8250;
    </button>

    <!-- Context menu -->
    <Teleport to="body">
      <div
        v-if="ctxVisible"
        class="r-tabs-view__ctx"
        :style="{ left: `${ctxPos.x}px`, top: `${ctxPos.y}px` }"
        role="menu"
        data-testid="tabs-context-menu"
      >
        <button role="menuitem" @click="ctxCloseSelf">Close</button>
        <button role="menuitem" @click="ctxCloseOther">Close Others</button>
        <button role="menuitem" @click="ctxCloseAll">Close All</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.r-tabs-view {
  display: flex;
  align-items: stretch;
  background: var(--ra-color-bg-surface);
  border-bottom: 1px solid var(--ra-color-border-default);
  flex-shrink: 0;
  position: relative;
}
.r-tabs-view__arrow {
  width: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ra-color-bg-surface);
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--ra-color-text-tertiary);
  transition: all var(--ra-transition-fast);
}
.r-tabs-view__arrow:hover {
  color: var(--ra-color-text-primary);
  background: var(--ra-color-bg-muted);
}
.r-tabs-view__scroll {
  display: flex;
  overflow-x: auto;
  padding: 0 var(--ra-spacing-2);
  gap: 2px;
  flex: 1;
  scrollbar-width: none;
}
.r-tabs-view__scroll::-webkit-scrollbar {
  display: none;
}
.r-tabs-view__tab {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font: inherit;
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-secondary);
  white-space: nowrap;
  transition: all var(--ra-transition-fast);
  min-height: 36px;
}
.r-tabs-view__tab:hover {
  color: var(--ra-color-text-primary);
  background: var(--ra-color-bg-muted);
}
.r-tabs-view__tab:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: -2px;
}
.r-tabs-view__tab--active {
  color: var(--ra-color-brand-primary);
  border-bottom-color: var(--ra-color-brand-primary);
  font-weight: 500;
}
.r-tabs-view__close {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--ra-radius-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--ra-color-text-tertiary);
  line-height: 1;
  padding: 0;
  transition: all var(--ra-transition-fast);
}
.r-tabs-view__close:hover {
  background: var(--ra-color-danger-bg);
  color: var(--ra-color-danger);
}
.r-tabs-view__ctx {
  position: fixed;
  z-index: 1000;
  background: var(--ra-color-bg-elevated, #fff);
  border: 1px solid var(--ra-color-border-default, #eee);
  border-radius: var(--ra-radius-md, 6px);
  box-shadow: var(--ra-shadow-lg);
  padding: 4px 0;
  min-width: 120px;
}
.r-tabs-view__ctx button {
  display: block;
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  text-align: left;
  font: inherit;
  font-size: var(--ra-font-size-sm, 13px);
  color: var(--ra-color-text-primary, #333);
  cursor: pointer;
}
.r-tabs-view__ctx button:hover {
  background: var(--ra-color-bg-muted, #f5f5f5);
}
</style>
