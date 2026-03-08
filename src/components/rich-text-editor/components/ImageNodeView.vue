<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
  editor: any
}>()

const imageRef = ref<HTMLImageElement | null>(null)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

const imgSrc = computed(() => props.node.attrs.src)
const imgAlt = computed(() => props.node.attrs.alt || '')
const imgTitle = computed(() => props.node.attrs.title || '')
const imgWidth = computed(() => props.node.attrs.width)
const textAlign = computed(() => props.node.attrs.textAlign || 'center')

const containerStyle = computed(() => ({
  textAlign: textAlign.value,
}))

const imageStyle = computed(() => {
  const styles: Record<string, string> = {}
  if (imgWidth.value) {
    styles.width = typeof imgWidth.value === 'number' ? `${imgWidth.value}px` : imgWidth.value
  }
  return styles
})

function setAlignment(align: 'left' | 'center' | 'right') {
  props.updateAttributes({ textAlign: align })
}

function startResize(event: MouseEvent) {
  event.preventDefault()
  if (!imageRef.value) return

  isResizing.value = true
  startX.value = event.clientX
  startWidth.value = imageRef.value.offsetWidth

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(event: MouseEvent) {
  if (!isResizing.value) return

  const diff = event.clientX - startX.value
  const newWidth = Math.max(50, startWidth.value + diff)
  props.updateAttributes({ width: newWidth })
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <NodeViewWrapper
    class="image-node-view"
    :class="{ 'image-node-view--selected': selected }"
    :style="containerStyle"
  >
    <div class="image-node-view__container" :class="{ 'image-node-view__container--selected': selected }">
      <img
        ref="imageRef"
        :src="imgSrc"
        :alt="imgAlt"
        :title="imgTitle"
        :style="imageStyle"
        class="image-node-view__img"
        draggable="false"
      />

      <div v-if="selected && !editor?.isEditable === false" class="image-node-view__toolbar">
        <button
          type="button"
          class="image-node-view__btn"
          :class="{ 'image-node-view__btn--active': textAlign === 'left' }"
          title="左对齐"
          @click="setAlignment('left')"
        >
          <AlignLeft :size="14" />
        </button>
        <button
          type="button"
          class="image-node-view__btn"
          :class="{ 'image-node-view__btn--active': textAlign === 'center' }"
          title="居中"
          @click="setAlignment('center')"
        >
          <AlignCenter :size="14" />
        </button>
        <button
          type="button"
          class="image-node-view__btn"
          :class="{ 'image-node-view__btn--active': textAlign === 'right' }"
          title="右对齐"
          @click="setAlignment('right')"
        >
          <AlignRight :size="14" />
        </button>
        <span class="image-node-view__divider" />
        <button
          type="button"
          class="image-node-view__btn image-node-view__btn--danger"
          title="删除图片"
          @click="deleteNode"
        >
          <Trash2 :size="14" />
        </button>
      </div>

      <div
        v-if="selected && !editor?.isEditable === false"
        class="image-node-view__resize-handle"
        @mousedown="startResize"
      />
    </div>

    <div v-if="imgWidth" class="image-node-view__size-hint">
      {{ typeof imgWidth === 'number' ? imgWidth : imgWidth }}px
    </div>
  </NodeViewWrapper>
</template>

<style>
.image-node-view {
  display: block;
  margin: 16px 0;
}

.image-node-view__container {
  display: inline-block;
  position: relative;
  max-width: 100%;
}

.image-node-view__container--selected {
  outline: 2px solid var(--ra-color-brand-primary, #0969da);
  outline-offset: 2px;
  border-radius: 4px;
}

.image-node-view__img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.image-node-view__toolbar {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: var(--ra-color-bg-surface, #fff);
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 6px);
  box-shadow: var(--ra-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
  z-index: 50;
}

.image-node-view__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--ra-radius-sm, 4px);
  background: transparent;
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.15s ease;
}

.image-node-view__btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
  color: var(--ra-color-text-primary, #24292f);
}

.image-node-view__btn--active {
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
}

.image-node-view__btn--active:hover {
  background: var(--ra-color-brand-primary, #0969da);
  opacity: 0.9;
}

.image-node-view__btn--danger:hover {
  background: #fef2f2;
  color: var(--ra-color-danger, #cf222e);
}

.image-node-view__divider {
  width: 1px;
  height: 20px;
  background: var(--ra-color-border-light, #e5e7eb);
  margin: 0 4px;
}

.image-node-view__resize-handle {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 12px;
  height: 12px;
  background: var(--ra-color-brand-primary, #0969da);
  border: 2px solid #fff;
  border-radius: 2px;
  cursor: se-resize;
  z-index: 10;
}

.image-node-view__resize-handle:hover {
  transform: scale(1.1);
}

.image-node-view__size-hint {
  font-size: 11px;
  color: var(--ra-color-text-tertiary, #6e7781);
  text-align: center;
  margin-top: 4px;
}
</style>
