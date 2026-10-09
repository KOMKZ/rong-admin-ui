<script lang="ts" setup>
  import { ref, nextTick, computed, onMounted, onUnmounted, type PropType } from 'vue'
  import { RouterLink } from 'vue-router'
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
  const actionsVisible = ref(false)
  // 动作菜单 Teleport 到 body，用触发按钮的视口坐标做 fixed 定位锚点。
  const actionsMenuPos = ref({ x: 0, y: 0 })

  const activeTab = computed(() => props.tabs.find((tab) => tab.key === props.activeKey))
  // affix 页签的关闭由消费方裁决，这里同步禁用入口，避免发出必然被忽略的 close。
  const canCloseActive = computed(() => Boolean(activeTab.value) && activeTab.value?.affix !== true)

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

  function toggleActionsMenu(event: MouseEvent): void {
    if (actionsVisible.value) {
      closeActionsMenu()
      return
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    // 菜单 min-width 128px，右缘对齐触发按钮、下缘留 4px 间距。
    actionsMenuPos.value = { x: rect.right, y: rect.bottom + 4 }
    actionsVisible.value = true
  }

  function closeActionsMenu(): void {
    actionsVisible.value = false
  }

  function actionsCloseSelf(): void {
    if (!activeTab.value || !canCloseActive.value) return
    emit('close', activeTab.value.key)
    closeActionsMenu()
  }

  function actionsCloseOther(): void {
    if (!activeTab.value) return
    emit('close-other', activeTab.value.key)
    closeActionsMenu()
  }

  function actionsCloseAll(): void {
    emit('close-all')
    closeActionsMenu()
  }

  function onDocClick(): void {
    if (actionsVisible.value) closeActionsMenu()
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
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="r-tabs-view__tab"
        :class="{ 'r-tabs-view__tab--active': tab.key === activeKey }"
      >
        <RouterLink
          class="r-tabs-view__link"
          role="tab"
          :aria-selected="tab.key === activeKey"
          :tabindex="tab.key === activeKey ? 0 : -1"
          :to="tab.path"
          @click="emit('select', tab.key)"
        >
          <span class="r-tabs-view__label">{{ tab.label }}</span>
        </RouterLink>
        <button
          v-if="tab.closable !== false && !tab.affix"
          class="r-tabs-view__close"
          aria-label="Close tab"
          tabindex="-1"
          @click.stop="emit('close', tab.key)"
        >
          &times;
        </button>
      </div>
    </div>

    <button
      v-if="canScrollRight"
      class="r-tabs-view__arrow r-tabs-view__arrow--right"
      aria-label="Scroll tabs right"
      @click="scrollBy(120)"
    >
      &#8250;
    </button>

    <button
      v-if="showContextMenu"
      class="r-tabs-view__actions-trigger"
      data-testid="tabs-actions-trigger"
      aria-label="Tab actions"
      :aria-expanded="actionsVisible"
      @click.stop="toggleActionsMenu"
    >
      &#9662;
    </button>

    <!-- Tab actions menu（作用于当前激活页签；页签链接的右键保留浏览器原生菜单） -->
    <Teleport to="body">
      <div
        v-if="actionsVisible"
        class="r-tabs-view__ctx"
        role="menu"
        data-testid="tabs-context-menu"
        :style="{ top: `${actionsMenuPos.y}px`, left: `${Math.max(8, actionsMenuPos.x - 132)}px` }"
      >
        <button role="menuitem" :disabled="!canCloseActive" @click="actionsCloseSelf">Close</button>
        <button role="menuitem" :disabled="!activeTab" @click="actionsCloseOther">
          Close Others
        </button>
        <button role="menuitem" @click="actionsCloseAll">Close All</button>
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
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    min-height: 36px;
  }
  .r-tabs-view__link {
    display: flex;
    align-items: center;
    padding: var(--ra-spacing-2) var(--ra-spacing-3);
    cursor: pointer;
    font: inherit;
    font-size: var(--ra-font-size-sm);
    color: var(--ra-color-text-secondary);
    text-decoration: none;
    transition: all var(--ra-transition-fast);
  }
  .r-tabs-view__tab:hover .r-tabs-view__link {
    color: var(--ra-color-text-primary);
    background: var(--ra-color-bg-muted);
  }
  .r-tabs-view__link:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: -2px;
  }
  .r-tabs-view__tab--active {
    border-bottom-color: var(--ra-color-brand-primary);
  }
  .r-tabs-view__tab--active .r-tabs-view__link {
    color: var(--ra-color-brand-primary);
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
    margin-right: var(--ra-spacing-1);
    transition: all var(--ra-transition-fast);
  }
  .r-tabs-view__close:hover {
    background: var(--ra-color-danger-bg);
    color: var(--ra-color-danger);
  }
  .r-tabs-view__actions-trigger {
    width: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    color: var(--ra-color-text-tertiary);
    transition: all var(--ra-transition-fast);
  }
  .r-tabs-view__actions-trigger:hover {
    color: var(--ra-color-text-primary);
    background: var(--ra-color-bg-muted);
  }
  .r-tabs-view__ctx {
    position: fixed;
    z-index: 1000;
    background: var(--ra-color-bg-elevated, #fff);
    border: 1px solid var(--ra-color-border-default, #eee);
    border-radius: var(--ra-radius-md);
    box-shadow: var(--ra-shadow-lg);
    padding: 4px 0;
    min-width: 128px;
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
  .r-tabs-view__ctx button:disabled {
    color: var(--ra-color-text-disabled, rgba(31, 34, 37, 0.36));
    cursor: not-allowed;
  }
  .r-tabs-view__ctx button:disabled:hover {
    background: none;
  }
</style>
