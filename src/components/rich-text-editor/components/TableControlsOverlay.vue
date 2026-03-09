<script lang="ts" setup>
import type { Editor } from '@tiptap/vue-3'
import { onMounted, onBeforeUnmount, ref, watch, computed, reactive } from 'vue'

const props = defineProps<{
  editor: Editor
  container: HTMLElement | null
}>()

const isVisible = ref(false)
const clusterStyle = ref<Record<string, string>>({})
const isHoveringCluster = ref(false)

const ability = reactive({
  addColumnBefore: false,
  addColumnAfter: false,
  addRowBefore: false,
  addRowAfter: false,
  deleteRow: false,
  deleteColumn: false,
})

const canAddColBefore = computed(() => ability.addColumnBefore)
const canAddColAfter = computed(() => ability.addColumnAfter)
const canAddRowBefore = computed(() => ability.addRowBefore)
const canAddRowAfter = computed(() => ability.addRowAfter)
const canDeleteRow = computed(() => ability.deleteRow)
const canDeleteCol = computed(() => ability.deleteColumn)

function refreshAbilities() {
  ability.addColumnBefore = props.editor.can().addColumnBefore()
  ability.addColumnAfter = props.editor.can().addColumnAfter()
  ability.addRowBefore = props.editor.can().addRowBefore()
  ability.addRowAfter = props.editor.can().addRowAfter()
  ability.deleteRow = props.editor.can().deleteRow()
  ability.deleteColumn = props.editor.can().deleteColumn()
}

function hide() {
  isVisible.value = false
}

let hideTimer: ReturnType<typeof setTimeout> | null = null
function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    if (!isHoveringCluster.value) hide()
  }, 3000)
}

function onClusterEnter() {
  isHoveringCluster.value = true
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}
function onClusterLeave() {
  isHoveringCluster.value = false
  scheduleHide()
}

function updatePosition() {
  if (!props.editor || !props.editor.isActive('table') || !props.container) {
    hide()
    refreshAbilities()
    return
  }
  const { state, view } = props.editor
  const { from } = state.selection
  const dom = view.domAtPos(from)
  let el = dom.node as HTMLElement | null
  while (el && el !== view.dom) {
    if (el.nodeName === 'TD' || el.nodeName === 'TH') break
    el = el.parentElement
  }
  if (!el) {
    hide()
    refreshAbilities()
    return
  }

  const cellRect = el.getBoundingClientRect()
  const containerRect = props.container.getBoundingClientRect()
  clusterStyle.value = {
    top: `${cellRect.top - containerRect.top - 48}px`,
    left: `${cellRect.left - containerRect.left + cellRect.width - 24}px`,
  }
  refreshAbilities()
  isVisible.value = true
  scheduleHide()
}

const addColBefore = () => props.editor.chain().focus().addColumnBefore().run()
const addColAfter = () => props.editor.chain().focus().addColumnAfter().run()
const addRowBefore = () => props.editor.chain().focus().addRowBefore().run()
const addRowAfter = () => props.editor.chain().focus().addRowAfter().run()
const deleteRow = () => props.editor.chain().focus().deleteRow().run()
const deleteCol = () => props.editor.chain().focus().deleteColumn().run()

function registerEvents() {
  props.editor.on('selectionUpdate', updatePosition)
  props.editor.on('transaction', updatePosition)
  window.addEventListener('resize', updatePosition)
}
function unregisterEvents() {
  props.editor.off('selectionUpdate', updatePosition)
  props.editor.off('transaction', updatePosition)
  window.removeEventListener('resize', updatePosition)
}

let scrollEl: HTMLElement | null = null
function attachScroll(el: HTMLElement | null) {
  if (scrollEl === el) return
  scrollEl?.removeEventListener('scroll', updatePosition, true)
  scrollEl = el
  scrollEl?.addEventListener('scroll', updatePosition, true)
}

watch(
  () => props.container,
  (v) => {
    attachScroll(v)
    updatePosition()
  },
)
onMounted(() => {
  registerEvents()
  updatePosition()
})
onBeforeUnmount(() => {
  unregisterEvents()
  attachScroll(null)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <div v-if="isVisible && container" class="rte-table-overlay">
    <div
      class="rte-table-cluster"
      :style="clusterStyle"
      @mouseenter="onClusterEnter"
      @mouseleave="onClusterLeave"
    >
      <div class="rte-table-cluster__section">
        <button class="rte-table-cluster__btn" :disabled="!canAddRowBefore" @click="addRowBefore">
          +行上
        </button>
        <button class="rte-table-cluster__btn" :disabled="!canAddRowAfter" @click="addRowAfter">
          +行下
        </button>
      </div>
      <span class="rte-table-cluster__sep" />
      <div class="rte-table-cluster__section">
        <button class="rte-table-cluster__btn" :disabled="!canAddColBefore" @click="addColBefore">
          +列前
        </button>
        <button class="rte-table-cluster__btn" :disabled="!canAddColAfter" @click="addColAfter">
          +列后
        </button>
      </div>
      <span class="rte-table-cluster__sep" />
      <div class="rte-table-cluster__section">
        <button
          class="rte-table-cluster__btn rte-table-cluster__btn--danger"
          :disabled="!canDeleteRow"
          @click="deleteRow"
        >
          删行
        </button>
        <button
          class="rte-table-cluster__btn rte-table-cluster__btn--danger"
          :disabled="!canDeleteCol"
          @click="deleteCol"
        >
          删列
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.rte-table-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.rte-table-cluster {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--ra-color-border-default, rgba(148, 163, 184, 0.4));
  box-shadow: var(--ra-shadow-lg, 0 8px 24px rgba(15, 23, 42, 0.12));
  pointer-events: auto;
  opacity: 0.6;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.rte-table-cluster:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.rte-table-cluster__section {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rte-table-cluster__sep {
  width: 1px;
  height: 28px;
  background: var(--ra-color-border-light, #e5e7eb);
}

.rte-table-cluster__btn {
  padding: 2px 8px;
  font-size: 11px;
  border: none;
  border-radius: var(--ra-radius-sm, 3px);
  background: transparent;
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.rte-table-cluster__btn:hover:not(:disabled) {
  background: var(--ra-color-bg-muted, #f3f4f6);
  color: var(--ra-color-text-primary, #24292f);
}

.rte-table-cluster__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.rte-table-cluster__btn--danger {
  color: var(--ra-color-danger, #cf222e);
}

.rte-table-cluster__btn--danger:hover:not(:disabled) {
  background: #fef2f2;
  color: var(--ra-color-danger, #cf222e);
}
</style>
