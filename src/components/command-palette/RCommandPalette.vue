<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { CommandItem } from './types'
import { RIcon } from '../icon'

const props = withDefaults(
  defineProps<{
    visible: boolean
    items: CommandItem[]
    placeholder?: string
    emptyText?: string
    loading?: boolean
  }>(),
  {
    placeholder: 'Type a command or search...',
    emptyText: 'No results found.',
    loading: false,
  },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [item: CommandItem]
  search: [query: string]
}>()

const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.items.filter((item) => !item.disabled)
  }
  const query = searchQuery.value.toLowerCase()
  return props.items.filter(
    (item) =>
      !item.disabled &&
      (item.label.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)),
  )
})

const groupedItems = computed(() => {
  const groups: Record<string, CommandItem[]> = {}
  for (const item of filteredItems.value) {
    const groupKey = item.group ?? ''
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
  }
  return groups
})

function close(): void {
  emit('update:visible', false)
  searchQuery.value = ''
  selectedIndex.value = 0
}

function selectItem(item: CommandItem): void {
  emit('select', item)
  close()
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredItems.value.length - 1)
    scrollToSelected()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    scrollToSelected()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = filteredItems.value[selectedIndex.value]
    if (item) {
      selectItem(item)
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

function scrollToSelected(): void {
  nextTick(() => {
    const selected = listRef.value?.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  })
}

function handleGlobalKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    emit('update:visible', !props.visible)
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  },
)

watch(searchQuery, (newVal) => {
  selectedIndex.value = 0
  emit('search', newVal)
})

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="r-command-palette">
      <div
        v-if="visible"
        class="r-command-palette__overlay"
        data-testid="command-palette-overlay"
        @click="close"
      >
        <div
          class="r-command-palette"
          data-testid="command-palette"
          @click.stop
        >
          <div class="r-command-palette__header">
            <RIcon name="search" size="sm" class="r-command-palette__search-icon" />
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              class="r-command-palette__input"
              :placeholder="placeholder"
              data-testid="command-palette-input"
              @keydown="handleKeydown"
            />
            <kbd class="r-command-palette__kbd">ESC</kbd>
          </div>

          <div v-if="loading" class="r-command-palette__loading">
            <RIcon name="loader" size="md" class="r-command-palette__spinner" />
            <span>Loading...</span>
          </div>

          <div v-else-if="filteredItems.length === 0" class="r-command-palette__empty">
            <RIcon name="inbox" size="lg" color="tertiary" />
            <p>{{ emptyText }}</p>
          </div>

          <div v-else ref="listRef" class="r-command-palette__list">
            <template v-for="(groupItems, groupName) in groupedItems" :key="groupName">
              <div v-if="groupName" class="r-command-palette__group-label">
                {{ groupName }}
              </div>
              <button
                v-for="item in groupItems"
                :key="item.id"
                class="r-command-palette__item"
                :class="{ 'r-command-palette__item--selected': filteredItems.indexOf(item) === selectedIndex }"
                :data-selected="filteredItems.indexOf(item) === selectedIndex"
                :data-testid="`command-item-${item.id}`"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = filteredItems.indexOf(item)"
              >
                <RIcon v-if="item.icon" :name="item.icon" size="sm" class="r-command-palette__item-icon" />
                <div class="r-command-palette__item-content">
                  <span class="r-command-palette__item-label">{{ item.label }}</span>
                  <span v-if="item.description" class="r-command-palette__item-desc">
                    {{ item.description }}
                  </span>
                </div>
                <kbd v-if="item.shortcut" class="r-command-palette__item-shortcut">
                  {{ item.shortcut }}
                </kbd>
              </button>
            </template>
          </div>

          <div class="r-command-palette__footer">
            <span class="r-command-palette__hint">
              <kbd>↑↓</kbd> to navigate
              <kbd>↵</kbd> to select
              <kbd>esc</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.r-command-palette__overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  background: var(--ra-color-bg-overlay);
  z-index: var(--ra-z-command-palette);
}

.r-command-palette {
  width: 100%;
  max-width: 560px;
  background: var(--ra-color-bg-surface);
  border-radius: var(--ra-radius-xl);
  box-shadow: var(--ra-shadow-2xl);
  overflow: hidden;
}

.r-command-palette__header {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-4);
  border-bottom: 1px solid var(--ra-color-border-light);
}

.r-command-palette__search-icon {
  color: var(--ra-color-text-tertiary);
  flex-shrink: 0;
}

.r-command-palette__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--ra-font-size-base);
  color: var(--ra-color-text-primary);
  outline: none;
}

.r-command-palette__input::placeholder {
  color: var(--ra-color-text-quaternary);
}

.r-command-palette__kbd {
  padding: var(--ra-spacing-0-5) var(--ra-spacing-1-5);
  background: var(--ra-color-bg-muted);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  font-family: var(--ra-font-family-mono);
  font-size: var(--ra-font-size-2xs);
  color: var(--ra-color-text-tertiary);
}

.r-command-palette__list {
  max-height: 320px;
  overflow-y: auto;
  padding: var(--ra-spacing-2);
}

.r-command-palette__group-label {
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  font-size: var(--ra-font-size-xs);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: var(--ra-letter-spacing-wider);
}

.r-command-palette__item {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  width: 100%;
  padding: var(--ra-spacing-3);
  background: transparent;
  border: none;
  border-radius: var(--ra-radius-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--ra-transition-fast);
}

.r-command-palette__item:hover,
.r-command-palette__item--selected {
  background: var(--ra-color-bg-hover);
}

.r-command-palette__item--selected {
  background: var(--ra-color-brand-subtle);
}

.r-command-palette__item-icon {
  color: var(--ra-color-text-tertiary);
  flex-shrink: 0;
}

.r-command-palette__item--selected .r-command-palette__item-icon {
  color: var(--ra-color-brand-primary);
}

.r-command-palette__item-content {
  flex: 1;
  min-width: 0;
}

.r-command-palette__item-label {
  display: block;
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-text-primary);
}

.r-command-palette__item-desc {
  display: block;
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-command-palette__item-shortcut {
  padding: var(--ra-spacing-0-5) var(--ra-spacing-1-5);
  background: var(--ra-color-bg-muted);
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-sm);
  font-family: var(--ra-font-family-mono);
  font-size: var(--ra-font-size-2xs);
  color: var(--ra-color-text-quaternary);
  flex-shrink: 0;
}

.r-command-palette__loading,
.r-command-palette__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-8);
  color: var(--ra-color-text-tertiary);
}

.r-command-palette__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.r-command-palette__footer {
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  border-top: 1px solid var(--ra-color-border-light);
  background: var(--ra-color-bg-surface-secondary);
}

.r-command-palette__hint {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-quaternary);
}

.r-command-palette__hint kbd {
  padding: var(--ra-spacing-0-5) var(--ra-spacing-1);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  font-family: var(--ra-font-family-mono);
  font-size: var(--ra-font-size-2xs);
}

.r-command-palette-enter-active,
.r-command-palette-leave-active {
  transition: opacity var(--ra-transition-fast);
}

.r-command-palette-enter-active .r-command-palette,
.r-command-palette-leave-active .r-command-palette {
  transition: transform var(--ra-transition-fast), opacity var(--ra-transition-fast);
}

.r-command-palette-enter-from,
.r-command-palette-leave-to {
  opacity: 0;
}

.r-command-palette-enter-from .r-command-palette,
.r-command-palette-leave-to .r-command-palette {
  opacity: 0;
  transform: scale(0.95);
}
</style>
