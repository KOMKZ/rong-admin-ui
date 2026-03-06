<script lang="ts" setup>
import { ref, computed, nextTick, watch, type PropType } from 'vue'
import { NButton, NInput, NCheckbox, NTooltip, NBadge } from 'naive-ui'
import RIcon from '../icon/RIcon.vue'
import type {
  TreeNodeData,
  TreeDensity,
  TreeNodeIcons,
  TreeI18n,
  TreeErrorCode,
  TreeError,
  DropPosition,
} from './types'
import { DEFAULT_I18N } from './types'

const props = defineProps({
  node: { type: Object as PropType<TreeNodeData>, required: true },
  depth: { type: Number, default: 0 },
  expanded: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  focused: { type: Boolean, default: false },
  editing: { type: Boolean, default: false },
  dragging: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  density: { type: String as PropType<TreeDensity>, default: 'default' },
  icons: { type: Object as PropType<TreeNodeIcons>, default: () => ({}) },
  i18n: { type: Object as PropType<TreeI18n>, default: () => ({}) },
  showCounts: { type: Boolean, default: false },
  draggable: { type: Boolean, default: true },
  selectable: { type: Boolean, default: false },
  checked: { type: Boolean, default: false },
  batchMode: { type: Boolean, default: false },
  searchMatch: { type: Boolean, default: false },
  highlightRanges: {
    type: Array as PropType<Array<{ start: number; end: number }>>,
    default: () => [],
  },
  error: { type: Object as PropType<TreeError | null>, default: null },
  dropTarget: { type: Boolean, default: false },
  dropPosition: { type: String as PropType<DropPosition | null>, default: null },
  dropLegal: { type: Boolean, default: true },
  dropReason: { type: String as PropType<TreeErrorCode | undefined>, default: undefined },
})

const emit = defineEmits<{
  toggle: []
  select: []
  startEdit: []
  submitEdit: [name: string]
  cancelEdit: []
  contextmenu: [event: MouseEvent]
  delete: []
  check: [checked: boolean]
  dragstart: []
  dragover: [position: DropPosition]
  dragend: []
  retryError: []
}>()

const t = computed(() => ({ ...DEFAULT_I18N, ...props.i18n }))
const editValue = ref('')
const editInputRef = ref<InstanceType<typeof NInput> | null>(null)

watch(
  () => props.editing,
  (val) => {
    if (val) {
      editValue.value = props.node.label
      nextTick(() => {
        const input = editInputRef.value?.$el?.querySelector('input')
        input?.focus()
        input?.select()
      })
    }
  },
)

const densityPadding = computed(() => {
  switch (props.density) {
    case 'compact': return { py: '1px', height: '28px' }
    case 'comfortable': return { py: '6px', height: '40px' }
    default: return { py: '3px', height: '34px' }
  }
})

const indentStyle = computed(() => ({
  paddingLeft: `${props.depth * 20 + 8}px`,
}))

const nodeClasses = computed(() => {
  const classes: string[] = ['rpte-node']
  if (props.selected) classes.push('rpte-node--selected')
  if (props.focused) classes.push('rpte-node--focused')
  if (props.editing) classes.push('rpte-node--editing')
  if (props.dragging) classes.push('rpte-node--dragging')
  if (props.disabled) classes.push('rpte-node--disabled')
  if (props.error) classes.push('rpte-node--error')
  if (props.dropTarget) {
    classes.push('rpte-node--drop-target')
    if (!props.dropLegal) classes.push('rpte-node--drop-invalid')
    if (props.dropPosition === 'before') classes.push('rpte-node--drop-before')
    if (props.dropPosition === 'after') classes.push('rpte-node--drop-after')
    if (props.dropPosition === 'inside') classes.push('rpte-node--drop-inside')
  }
  if (props.searchMatch) classes.push('rpte-node--match')
  return classes
})

const iconName = computed(() => {
  if (props.loading) return props.icons.loading ?? 'loader'
  if (props.disabled) return props.icons.locked ?? 'lock'
  if (props.expanded) return props.icons.folderOpen ?? 'folder-open'
  if (props.node.children?.length) return props.icons.folder ?? 'folder'
  return props.icons.leaf ?? 'folder'
})

function handleSubmitEdit(): void {
  const value = editValue.value.trim()
  if (value && value !== props.node.label) {
    emit('submitEdit', value)
  } else {
    emit('cancelEdit')
  }
}

function handleDragStart(e: DragEvent): void {
  if (!props.draggable || props.disabled || props.editing) return
  e.dataTransfer?.setData('text/plain', String(props.node.id))
  emit('dragstart')
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault()
  if (!props.draggable) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  const height = rect.height
  let position: DropPosition = 'inside'
  if (y < height * 0.25) position = 'before'
  else if (y > height * 0.75) position = 'after'
  emit('dragover', position)
}

function handleDrop(e: DragEvent): void {
  e.preventDefault()
  emit('dragend')
}

function handleContextMenu(e: MouseEvent): void {
  e.preventDefault()
  emit('contextmenu', e)
}

function renderHighlightedLabel(): string {
  if (!props.highlightRanges.length) return props.node.label
  let html = ''
  let lastEnd = 0
  for (const { start, end } of props.highlightRanges) {
    html += escapeHtml(props.node.label.slice(lastEnd, start))
    html += `<mark class="rpte-node__highlight">${escapeHtml(props.node.label.slice(start, end))}</mark>`
    lastEnd = end
  }
  html += escapeHtml(props.node.label.slice(lastEnd))
  return html
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[c] ?? c
  })
}
</script>

<template>
  <div
    :class="nodeClasses"
    :style="{ ...indentStyle, minHeight: densityPadding.height }"
    :draggable="draggable && !editing && !disabled"
    :aria-selected="selected"
    :aria-expanded="node.children?.length ? expanded : undefined"
    :aria-disabled="disabled"
    role="treeitem"
    :data-testid="`tree-node-${node.id}`"
    :data-node-id="node.id"
    @click.stop="editing ? undefined : emit('select')"
    @dblclick.stop="emit('startEdit')"
    @contextmenu="handleContextMenu"
    @dragstart="handleDragStart"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- Expand/Collapse toggle -->
    <button
      v-if="node.children?.length || loading"
      class="rpte-node__toggle"
      :aria-label="expanded ? 'collapse' : 'expand'"
      data-testid="tree-node-toggle"
      @click.stop="emit('toggle')"
    >
      <RIcon
        v-if="loading"
        name="loader"
        :size="14"
        class="rpte-node__spinner"
      />
      <RIcon
        v-else
        :name="expanded ? 'chevron-down' : 'chevron-right'"
        :size="14"
      />
    </button>
    <span v-else class="rpte-node__toggle-spacer" />

    <!-- Batch checkbox -->
    <NCheckbox
      v-if="batchMode && selectable"
      :checked="checked"
      size="small"
      class="rpte-node__checkbox"
      @update:checked="(val: boolean) => emit('check', val)"
      @click.stop
    />

    <!-- Node icon -->
    <span class="rpte-node__icon">
      <slot name="node-icon" :node="node" :expanded="expanded">
        <RIcon :name="iconName" :size="16" />
      </slot>
    </span>

    <!-- Label / Edit -->
    <div class="rpte-node__content">
      <template v-if="editing">
        <NInput
          ref="editInputRef"
          v-model:value="editValue"
          size="tiny"
          class="rpte-node__edit-input"
          data-testid="tree-node-edit-input"
          @keydown.enter.stop="handleSubmitEdit"
          @keydown.esc.stop="emit('cancelEdit')"
          @blur="handleSubmitEdit"
        />
      </template>
      <template v-else>
        <span class="rpte-node__label">
          <slot name="node-label" :node="node">
            <!-- eslint-disable-next-line vue/no-v-html -- search highlight uses pre-escaped html -->
            <span v-if="highlightRanges.length" v-html="renderHighlightedLabel()" />
            <span v-else>{{ node.label }}</span>
          </slot>
        </span>

        <!-- Count badges -->
        <span v-if="showCounts && (node.itemCount || node.totalItemCount)" class="rpte-node__counts">
          <NTooltip v-if="node.itemCount">
            <template #trigger>
              <NBadge
                :value="node.itemCount"
                :max="999"
                type="default"
                :offset="[0, 0]"
                processing
              />
            </template>
            {{ (t.items ?? '').replace('{count}', String(node.itemCount)) }}
          </NTooltip>
        </span>

        <!-- Extra slot -->
        <span class="rpte-node__extra">
          <slot name="node-extra" :node="node" />
        </span>
      </template>
    </div>

    <!-- Inline actions (hover) -->
    <div v-if="!editing && !disabled" class="rpte-node__actions">
      <slot name="node-actions" :node="node">
        <NButton
          quaternary
          size="tiny"
          class="rpte-node__action-btn"
          data-testid="tree-node-add-child"
          @click.stop="emit('startEdit')"
        >
          <template #icon><RIcon name="plus" :size="12" /></template>
        </NButton>
        <NButton
          quaternary
          size="tiny"
          class="rpte-node__action-btn"
          data-testid="tree-node-rename"
          @click.stop="emit('startEdit')"
        >
          <template #icon><RIcon name="pencil" :size="12" /></template>
        </NButton>
        <NButton
          quaternary
          size="tiny"
          class="rpte-node__action-btn rpte-node__action-btn--danger"
          data-testid="tree-node-delete"
          @click.stop="emit('delete')"
        >
          <template #icon><RIcon name="trash-2" :size="12" /></template>
        </NButton>
      </slot>
    </div>

    <!-- Error indicator -->
    <div v-if="error" class="rpte-node__error" data-testid="tree-node-error">
      <NTooltip>
        <template #trigger>
          <RIcon name="alert-circle" :size="14" class="rpte-node__error-icon" />
        </template>
        {{ error.message }}
      </NTooltip>
      <NButton
        text
        size="tiny"
        type="warning"
        data-testid="tree-node-retry"
        @click.stop="emit('retryError')"
      >
        {{ t.retry }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.rpte-node {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  padding-right: var(--ra-spacing-2);
  cursor: pointer;
  user-select: none;
  transition:
    background var(--ra-transition-fast),
    border-color var(--ra-transition-fast);
  border: 2px solid transparent;
  border-radius: var(--ra-radius-sm);
  position: relative;
}
.rpte-node:hover {
  background: var(--ra-color-bg-hover);
}
.rpte-node:hover .rpte-node__actions {
  opacity: 1;
  pointer-events: auto;
}
.rpte-node--selected {
  background: var(--ra-color-brand-subtle);
}
.rpte-node--selected:hover {
  background: var(--ra-color-brand-light);
}
.rpte-node--focused {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: -2px;
}
.rpte-node--editing {
  background: var(--ra-color-bg-surface);
}
.rpte-node--dragging {
  opacity: 0.5;
}
.rpte-node--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.rpte-node--error {
  border-color: var(--ra-color-danger-border);
  background: var(--ra-color-danger-bg);
}
.rpte-node--match {
  background: var(--ra-color-warning-bg);
}
.rpte-node--match.rpte-node--selected {
  background: var(--ra-color-brand-subtle);
}

/* Drop target indicators */
.rpte-node--drop-target.rpte-node--drop-inside {
  border-color: var(--ra-color-brand-primary);
  background: var(--ra-color-brand-subtle);
}
.rpte-node--drop-target.rpte-node--drop-before::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ra-color-brand-primary);
  border-radius: 1px;
}
.rpte-node--drop-target.rpte-node--drop-after::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ra-color-brand-primary);
  border-radius: 1px;
}
.rpte-node--drop-invalid.rpte-node--drop-inside {
  border-color: var(--ra-color-danger);
  background: var(--ra-color-danger-bg);
}
.rpte-node--drop-invalid.rpte-node--drop-before::before,
.rpte-node--drop-invalid.rpte-node--drop-after::after {
  background: var(--ra-color-danger);
}

.rpte-node__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--ra-color-text-tertiary);
  border-radius: var(--ra-radius-sm);
  padding: 0;
  transition: color var(--ra-transition-fast);
}
.rpte-node__toggle:hover {
  color: var(--ra-color-text-primary);
  background: var(--ra-color-bg-active);
}
.rpte-node__toggle-spacer {
  width: 20px;
  flex-shrink: 0;
}
.rpte-node__spinner {
  animation: rpte-spin 1s linear infinite;
}
@keyframes rpte-spin {
  to { transform: rotate(360deg); }
}

.rpte-node__checkbox {
  flex-shrink: 0;
}

.rpte-node__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--ra-color-text-tertiary);
}

.rpte-node__content {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1-5);
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.rpte-node__label {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--ra-line-height-snug);
}

.rpte-node__edit-input {
  flex: 1;
  min-width: 80px;
}

.rpte-node__counts {
  flex-shrink: 0;
}

.rpte-node__extra {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.rpte-node__actions {
  display: flex;
  align-items: center;
  gap: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--ra-transition-fast);
  flex-shrink: 0;
}

.rpte-node__action-btn {
  color: var(--ra-color-text-tertiary);
}
.rpte-node__action-btn:hover {
  color: var(--ra-color-text-primary);
}
.rpte-node__action-btn--danger:hover {
  color: var(--ra-color-danger);
}

.rpte-node__error {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  flex-shrink: 0;
}
.rpte-node__error-icon {
  color: var(--ra-color-danger);
}

:deep(.rpte-node__highlight) {
  background: var(--ra-color-warning);
  color: var(--ra-color-text-primary);
  padding: 0 1px;
  border-radius: 2px;
}
</style>
