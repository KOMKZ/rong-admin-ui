<template>
  <div
    ref="containerRef"
    class="r-tree-select"
    :class="[
      `r-tree-select--${mergedSize}`,
      {
        'r-tree-select--open': isOpen,
        'r-tree-select--disabled': disabled,
        'r-tree-select--focused': isFocused,
      },
    ]"
    :data-testid="$attrs['data-testid'] ?? 'r-tree-select'"
  >
    <!-- Trigger -->
    <div
      v-if="$slots.trigger"
      @click="handleTriggerClick"
      @keydown.enter.space.prevent="handleTriggerClick"
    >
      <slot name="trigger" :selected-node="selectedNode" :open="isOpen" />
    </div>
    <div
      v-else
      class="r-tree-select__trigger"
      role="combobox"
      tabindex="0"
      :aria-expanded="isOpen"
      :aria-disabled="disabled"
      aria-haspopup="tree"
      data-testid="r-tree-select-trigger"
      @click="handleTriggerClick"
      @keydown="handleTriggerKeydown"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <span v-if="selectedNode" class="r-tree-select__value" data-testid="r-tree-select-value">
        {{ selectedNode.label }}
      </span>
      <span v-else class="r-tree-select__placeholder">
        {{ mergedI18n.placeholder }}
      </span>
      <span class="r-tree-select__actions">
        <span
          v-if="clearable && selectedNode"
          class="r-tree-select__clear"
          role="button"
          tabindex="-1"
          :aria-label="mergedI18n.clear"
          data-testid="r-tree-select-clear"
          @click.stop="handleClear"
          @keydown.enter.stop="handleClear"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </span>
        <span class="r-tree-select__arrow" :class="{ 'r-tree-select__arrow--open': isOpen }">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </span>
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <Transition name="r-tree-select-dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="r-tree-select__dropdown"
          :style="dropdownStyle"
          role="tree"
          data-testid="r-tree-select-dropdown"
          @mousedown.prevent
        >
          <!-- Search -->
          <div v-if="searchable" class="r-tree-select__search">
            <input
              ref="searchInputRef"
              v-model="keyword"
              class="r-tree-select__search-input"
              type="search"
              :placeholder="mergedI18n.search"
              :aria-label="mergedI18n.search"
              autocomplete="off"
              data-testid="r-tree-select-search"
              @keydown.esc="close"
              @keydown.down.prevent="focusFirstNode"
            />
            <svg class="r-tree-select__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          <!-- Tree content -->
          <div class="r-tree-select__content" :style="{ maxHeight: contentMaxHeight }">
            <div v-if="isLoading" class="r-tree-select__status" data-testid="r-tree-select-loading">
              {{ mergedI18n.loading }}
            </div>
            <div v-else-if="loadError" class="r-tree-select__status r-tree-select__status--error" data-testid="r-tree-select-error">
              {{ loadError }}
              <button class="r-tree-select__retry" @click="loadRemoteData">↻</button>
            </div>
            <div v-else-if="filteredNodes.length === 0" class="r-tree-select__status" data-testid="r-tree-select-empty">
              <slot name="empty">{{ mergedI18n.noData }}</slot>
            </div>
            <template v-else>
              <TreeNode
                v-for="node in filteredNodes"
                :key="node.id"
                :node="node"
                :depth="0"
                :expanded-keys="expandedKeys"
                :selected-id="modelValue"
                :keyword="keyword"
                @select="handleSelect"
                @toggle="handleToggle"
              >
                <template v-if="$slots['node-label']" #label="slotProps">
                  <slot name="node-label" v-bind="slotProps" />
                </template>
                <template v-if="$slots['node-icon']" #icon="slotProps">
                  <slot name="node-icon" v-bind="slotProps" />
                </template>
              </TreeNode>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  type CSSProperties,
} from 'vue'
import TreeNode from './TreeNode.vue'
import {
  DEFAULT_TREE_SELECT_I18N,
  type RTreeSelectProps,
  type TreeSelectNode,
  type TreeSelectI18n,
} from './types'

const props = withDefaults(defineProps<RTreeSelectProps>(), {
  options: () => [],
  disabled: false,
  clearable: true,
  size: 'medium',
  searchable: true,
  defaultExpandLevel: 1,
  maxHeight: 320,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  select: [node: TreeSelectNode | null]
  clear: []
}>()

const containerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()

const isOpen = ref(false)
const isFocused = ref(false)
const isLoading = ref(false)
const keyword = ref('')
const expandedKeys = ref<Set<string | number>>(new Set())
const treeData = ref<TreeSelectNode[]>([])

const mergedI18n = computed<Required<TreeSelectI18n>>(() => ({
  ...DEFAULT_TREE_SELECT_I18N,
  ...props.i18n,
}) as Required<TreeSelectI18n>)

const mergedSize = computed(() => props.size)

const contentMaxHeight = computed(() =>
  typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight,
)

const dropdownStyle = ref<CSSProperties>({})

const currentNodes = computed<TreeSelectNode[]>(() =>
  treeData.value.length > 0 ? treeData.value : props.options,
)

const flatNodes = computed<TreeSelectNode[]>(() => {
  const result: TreeSelectNode[] = []
  function walk(nodes: TreeSelectNode[]): void {
    for (const n of nodes) {
      result.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(currentNodes.value)
  return result
})

const selectedNode = computed<TreeSelectNode | null>(() => {
  if (props.modelValue == null) return null
  return flatNodes.value.find((n) => n.id === props.modelValue) ?? null
})

const filteredNodes = computed<TreeSelectNode[]>(() => {
  if (!keyword.value.trim()) return currentNodes.value
  const kw = keyword.value.toLowerCase()
  const matchIds = new Set<string | number>()

  for (const n of flatNodes.value) {
    if (n.label.toLowerCase().includes(kw)) {
      matchIds.add(n.id)
      let pid = n.parentId
      while (pid != null) {
        matchIds.add(pid)
        const parent = flatNodes.value.find((p) => p.id === pid)
        pid = parent?.parentId ?? null
      }
    }
  }

  function filterTree(nodes: TreeSelectNode[]): TreeSelectNode[] {
    return nodes
      .filter((n) => matchIds.has(n.id))
      .map((n) => ({
        ...n,
        children: n.children ? filterTree(n.children) : undefined,
      }))
  }

  return filterTree(currentNodes.value)
})

function initExpandedKeys(): void {
  const keys = new Set<string | number>()
  function walk(nodes: TreeSelectNode[], depth: number): void {
    for (const n of nodes) {
      if (depth < props.defaultExpandLevel && n.children?.length) {
        keys.add(n.id)
        walk(n.children, depth + 1)
      }
    }
  }
  walk(currentNodes.value, 0)

  if (props.modelValue != null) {
    const node = flatNodes.value.find((n) => n.id === props.modelValue)
    if (node) {
      let pid = node.parentId
      while (pid != null) {
        keys.add(pid)
        const parent = flatNodes.value.find((p) => p.id === pid)
        pid = parent?.parentId ?? null
      }
    }
  }

  expandedKeys.value = keys
}

function updateDropdownPosition(): void {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropAbove = spaceBelow < 200 && rect.top > spaceBelow

  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 200)}px`,
    zIndex: 9999,
    ...(dropAbove
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  }
}

const loadError = ref<string | null>(null)

async function loadRemoteData(): Promise<void> {
  if (!props.loadData) return
  isLoading.value = true
  loadError.value = null
  try {
    treeData.value = await props.loadData()
    initExpandedKeys()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Load failed'
    treeData.value = []
  } finally {
    isLoading.value = false
  }
}

function open(): void {
  if (props.disabled) return
  isOpen.value = true
  keyword.value = ''
  updateDropdownPosition()
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function close(): void {
  isOpen.value = false
}

function handleTriggerClick(): void {
  if (props.disabled) return
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function handleTriggerKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleTriggerClick()
  } else if (e.key === 'Escape') {
    close()
  }
}

function handleSelect(node: TreeSelectNode): void {
  if (node.disabled) return
  emit('update:modelValue', node.id)
  emit('select', node)
  close()
}

function handleClear(): void {
  emit('update:modelValue', null)
  emit('select', null)
  emit('clear')
}

function handleToggle(id: string | number): void {
  const keys = new Set(expandedKeys.value)
  if (keys.has(id)) {
    keys.delete(id)
  } else {
    keys.add(id)
  }
  expandedKeys.value = keys
}

function focusFirstNode(): void {
  const firstItem = dropdownRef.value?.querySelector('[role="treeitem"]') as HTMLElement
  firstItem?.focus()
}

function handleClickOutside(e: MouseEvent): void {
  if (
    !containerRef.value?.contains(e.target as Node) &&
    !dropdownRef.value?.contains(e.target as Node)
  ) {
    close()
  }
}

function handleScroll(): void {
  if (isOpen.value) updateDropdownPosition()
}

watch(
  () => keyword.value,
  (kw) => {
    if (kw.trim()) {
      const ids = new Set(expandedKeys.value)
      for (const n of flatNodes.value) {
        if (n.label.toLowerCase().includes(kw.toLowerCase()) && n.parentId != null) {
          let pid: string | number | null = n.parentId
          while (pid != null) {
            ids.add(pid)
            const parent = flatNodes.value.find((p) => p.id === pid)
            pid = parent?.parentId ?? null
          }
        }
      }
      expandedKeys.value = ids
    }
  },
)

watch(
  () => props.options,
  () => {
    if (!props.loadData) initExpandedKeys()
  },
  { deep: true },
)

onMounted(() => {
  initExpandedKeys()
  if (props.loadData && currentNodes.value.length === 0) {
    loadRemoteData()
  }
  document.addEventListener('click', handleClickOutside, true)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})

defineExpose({
  reload: loadRemoteData,
  open,
  close,
  getSelectedNode: () => selectedNode.value,
})
</script>

<style>
.r-tree-select {
  position: relative;
  display: inline-flex;
  width: 100%;
}

.r-tree-select--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ─── Trigger ─── */

.r-tree-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-primary);
  cursor: pointer;
  transition:
    border-color var(--ra-transition-fast),
    box-shadow var(--ra-transition-fast);
  outline: none;
}

.r-tree-select--small .r-tree-select__trigger {
  height: 28px;
  padding: 0 8px;
  font-size: var(--ra-font-size-xs);
}

.r-tree-select--medium .r-tree-select__trigger {
  height: 34px;
  padding: 0 12px;
  font-size: var(--ra-font-size-sm);
}

.r-tree-select--large .r-tree-select__trigger {
  height: 40px;
  padding: 0 14px;
  font-size: var(--ra-font-size-base);
}

.r-tree-select--focused .r-tree-select__trigger,
.r-tree-select--open .r-tree-select__trigger {
  border-color: var(--ra-color-border-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ra-color-brand-primary) 15%, transparent);
}

.r-tree-select__trigger:hover {
  border-color: var(--ra-color-border-interactive);
}

.r-tree-select__value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-tree-select__placeholder {
  flex: 1;
  color: var(--ra-color-text-quaternary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-tree-select__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  flex-shrink: 0;
}

.r-tree-select__clear {
  display: flex;
  align-items: center;
  color: var(--ra-color-text-tertiary);
  cursor: pointer;
  border-radius: var(--ra-radius-sm);
  padding: 1px;
  transition: color var(--ra-transition-fast);
}

.r-tree-select__clear:hover {
  color: var(--ra-color-text-primary);
}

.r-tree-select__arrow {
  display: flex;
  align-items: center;
  color: var(--ra-color-text-tertiary);
  transition: transform var(--ra-transition-fast);
}

.r-tree-select__arrow--open {
  transform: rotate(180deg);
}

/* ─── Dropdown ─── */

.r-tree-select__dropdown {
  background: var(--ra-color-bg-elevated);
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-lg);
  box-shadow: var(--ra-shadow-lg);
  overflow: hidden;
}

.r-tree-select-dropdown-enter-active,
.r-tree-select-dropdown-leave-active {
  transition:
    opacity var(--ra-transition-fast),
    transform var(--ra-transition-fast);
}

.r-tree-select-dropdown-enter-from,
.r-tree-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─── Search ─── */

.r-tree-select__search {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid var(--ra-color-border-light);
}

.r-tree-select__search-input {
  width: 100%;
  height: 30px;
  padding: 0 8px 0 28px;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  outline: none;
  transition: border-color var(--ra-transition-fast);
}

.r-tree-select__search-input:focus {
  border-color: var(--ra-color-border-focus);
}

.r-tree-select__search-input::placeholder {
  color: var(--ra-color-text-quaternary);
}

.r-tree-select__search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ra-color-text-tertiary);
  pointer-events: none;
}

/* ─── Content ─── */

.r-tree-select__content {
  overflow-y: auto;
  padding: 4px 0;
}

.r-tree-select__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-sm);
}

.r-tree-select__status--error {
  color: var(--ra-color-danger-text);
}

.r-tree-select__retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: border-color var(--ra-transition-fast);
}

.r-tree-select__retry:hover {
  border-color: var(--ra-color-brand-primary);
  color: var(--ra-color-brand-primary);
}
</style>
