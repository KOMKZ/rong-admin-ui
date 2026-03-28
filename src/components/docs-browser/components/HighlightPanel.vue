<template>
  <div class="r-docs-highlight-panel" data-testid="highlight-panel">
    <div class="r-docs-highlight-panel__header">
      <span class="r-docs-highlight-panel__title">高亮笔记 ({{ highlights.length }})</span>
      <div class="r-docs-highlight-panel__actions">
        <button
          v-if="highlights.length > 0"
          class="r-docs-highlight-panel__btn"
          title="一键复制"
          data-testid="highlight-copy-all"
          @click="$emit('copy-all')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button
          v-if="highlights.length > 0"
          class="r-docs-highlight-panel__btn r-docs-highlight-panel__btn--danger"
          title="清除全部"
          data-testid="highlight-clear-all"
          @click="$emit('clear-all')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
        <button
          class="r-docs-highlight-panel__btn"
          title="关闭面板"
          @click="$emit('close')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <div class="r-docs-highlight-panel__body">
      <div v-if="loading" class="r-docs-highlight-panel__loading">加载中...</div>
      <div v-else-if="highlights.length === 0" class="r-docs-highlight-panel__empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span>开启笔刷模式后，选中文本即可高亮</span>
      </div>
      <div
        v-for="item in highlights"
        :key="item.id"
        class="r-docs-highlight-item"
        :data-highlight-id="item.id"
      >
        <div class="r-docs-highlight-item__color" :style="{ background: colorMap[item.color as HighlightColor] || colorMap.yellow }"></div>
        <div class="r-docs-highlight-item__content">
          <p class="r-docs-highlight-item__text">{{ item.text }}</p>
          <template v-if="editingNoteId === item.id">
            <textarea
              v-model="localNoteText"
              class="r-docs-highlight-item__note-input"
              rows="2"
              placeholder="输入备注..."
              @keydown.enter.ctrl="$emit('save-note')"
            ></textarea>
            <div class="r-docs-highlight-item__note-actions">
              <button class="r-docs-highlight-item__note-btn r-docs-highlight-item__note-btn--save" @click="$emit('save-note')">保存</button>
              <button class="r-docs-highlight-item__note-btn" @click="$emit('cancel-note')">取消</button>
            </div>
          </template>
          <template v-else>
            <p v-if="item.note" class="r-docs-highlight-item__note">{{ item.note }}</p>
            <button
              class="r-docs-highlight-item__add-note"
              @click="$emit('edit-note', item.id)"
            >
              {{ item.note ? '编辑备注' : '添加备注' }}
            </button>
          </template>
        </div>
        <button
          class="r-docs-highlight-item__delete"
          title="删除"
          @click="$emit('delete', item.id)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { HighlightItem, HighlightColor } from '../types'

const props = defineProps<{
  highlights: HighlightItem[]
  loading: boolean
  editingNoteId: number | null
  editingNoteText: string
  colorMap: Record<HighlightColor, string>
}>()

const emit = defineEmits<{
  (e: 'copy-all'): void
  (e: 'clear-all'): void
  (e: 'close'): void
  (e: 'delete', id: number): void
  (e: 'edit-note', id: number): void
  (e: 'save-note'): void
  (e: 'cancel-note'): void
  (e: 'update:editingNoteText', value: string): void
}>()

const localNoteText = computed({
  get: () => props.editingNoteText,
  set: (v) => emit('update:editingNoteText', v),
})
</script>

<style>
.r-docs-highlight-panel {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-surface, #ffffff);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.r-docs-highlight-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-surface-secondary, #fafbfc);
}

.r-docs-highlight-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-highlight-panel__actions {
  display: flex;
  gap: 4px;
}

.r-docs-highlight-panel__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: 6px;
  background: var(--ra-color-surface, #fff);
  color: var(--ra-color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s;
}

.r-docs-highlight-panel__btn:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-highlight-panel__btn--danger:hover {
  color: var(--ra-color-danger, #dc2626);
  border-color: var(--ra-color-danger, #dc2626);
}

.r-docs-highlight-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.r-docs-highlight-panel__loading,
.r-docs-highlight-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 16px;
  font-size: 13px;
  color: var(--ra-color-text-tertiary, #9ca3af);
  text-align: center;
}

.r-docs-highlight-item {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ra-color-border-light, #f3f4f6);
  transition: background 0.15s;
  position: relative;
}

.r-docs-highlight-item:hover {
  background: var(--ra-color-surface-hover, #fafbfc);
}

.r-docs-highlight-item__color {
  width: 4px;
  flex-shrink: 0;
  border-radius: 2px;
  margin-top: 2px;
}

.r-docs-highlight-item__content {
  flex: 1;
  min-width: 0;
}

.r-docs-highlight-item__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ra-color-text-primary, #111827);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.r-docs-highlight-item__note {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ra-color-text-secondary, #6b7280);
  background: var(--ra-color-surface-secondary, #f9fafb);
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 2px solid var(--ra-color-primary, #2563eb);
}

.r-docs-highlight-item__add-note {
  margin-top: 4px;
  border: none;
  background: none;
  color: var(--ra-color-primary, #2563eb);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.r-docs-highlight-item__add-note:hover {
  text-decoration: underline;
}

.r-docs-highlight-item__note-input {
  width: 100%;
  margin-top: 6px;
  padding: 6px 8px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  font-family: inherit;
}

.r-docs-highlight-item__note-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.r-docs-highlight-item__note-btn {
  padding: 2px 8px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: 4px;
  background: var(--ra-color-surface, #fff);
  font-size: 11px;
  cursor: pointer;
}

.r-docs-highlight-item__note-btn--save {
  background: var(--ra-color-primary, #2563eb);
  border-color: var(--ra-color-primary, #2563eb);
  color: #fff;
}

.r-docs-highlight-item__delete {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--ra-color-text-tertiary, #9ca3af);
  cursor: pointer;
}

.r-docs-highlight-item:hover .r-docs-highlight-item__delete {
  display: flex;
}

.r-docs-highlight-item__delete:hover {
  background: var(--ra-color-danger-subtle, #fef2f2);
  color: var(--ra-color-danger, #dc2626);
}
</style>
