<script setup lang="ts">
import { computed } from 'vue'
import type { ProUploadFileItem, ProUploadLocale } from './types'
import { defaultLocale } from './types'

const props = withDefaults(
  defineProps<{
    file: ProUploadFileItem
    listType: 'text' | 'picture' | 'picture-card'
    disabled: boolean
    readonly: boolean
    locale?: Partial<ProUploadLocale>
  }>(),
  {
    locale: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'remove', uid: string): void
  (e: 'retry', uid: string): void
  (e: 'preview', file: ProUploadFileItem): void
}>()

function t(key: keyof ProUploadLocale): string {
  return props.locale[key] ?? defaultLocale[key] ?? key
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const previewUrl = computed(() => props.file.thumbUrl ?? props.file.url)

const isPicture = computed(() => props.listType !== 'text')
const isCard = computed(() => props.listType === 'picture-card')

const statusClass = computed(() => `rpu-item--${props.file.status}`)
</script>

<template>
  <div
    :class="['rpu-item', statusClass, { 'rpu-item--card': isCard, 'rpu-item--row': !isCard }]"
    :data-testid="`pro-upload-item-${file.uid}`"
    role="listitem"
    :aria-label="file.name"
  >
    <!-- Thumbnail -->
    <div v-if="isPicture" class="rpu-item__thumb" @click="emit('preview', file)">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="file.name"
        class="rpu-item__thumb-img"
        loading="lazy"
      />
      <div v-else class="rpu-item__thumb-placeholder">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>

      <!-- Upload overlay -->
      <div v-if="file.status === 'uploading'" class="rpu-item__overlay">
        <div class="rpu-item__progress-ring">
          <svg viewBox="0 0 36 36" class="rpu-item__ring-svg">
            <circle cx="18" cy="18" r="15" fill="none" stroke-width="3" class="rpu-item__ring-bg" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke-width="3"
              class="rpu-item__ring-fill"
              :stroke-dasharray="`${file.progress * 0.94} 100`"
            />
          </svg>
          <span class="rpu-item__progress-text">{{ file.progress }}%</span>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="rpu-item__info">
      <span class="rpu-item__name" :title="file.name">{{ file.name }}</span>
      <span v-if="!isCard" class="rpu-item__size">{{ formatSize(file.size) }}</span>
      <span v-if="file.status === 'error'" class="rpu-item__error">{{
        file.error ?? t('uploadFailed')
      }}</span>

      <!-- Text-mode progress bar -->
      <div v-if="!isCard && file.status === 'uploading'" class="rpu-item__bar-wrap">
        <div
          class="rpu-item__bar"
          :style="{ width: `${file.progress}%` }"
          role="progressbar"
          :aria-valuenow="file.progress"
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>

    <!-- Actions -->
    <div v-if="!readonly" class="rpu-item__actions">
      <button
        v-if="file.status === 'error'"
        type="button"
        class="rpu-item__action rpu-item__action--retry"
        :title="t('retryLabel')"
        :disabled="disabled"
        :aria-label="`${t('retryLabel')} ${file.name}`"
        @click.stop="emit('retry', file.uid)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      </button>
      <button
        type="button"
        class="rpu-item__action rpu-item__action--remove"
        :title="t('deleteLabel')"
        :disabled="disabled"
        :aria-label="`${t('deleteLabel')} ${file.name}`"
        @click.stop="emit('remove', file.uid)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.rpu-item {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--ra-radius-md);
  transition:
    background var(--ra-transition-fast),
    border-color var(--ra-transition-fast);
}

/* ── Row mode (text / picture list) ── */
.rpu-item--row {
  gap: var(--ra-spacing-2);
  padding: var(--ra-spacing-1-5) var(--ra-spacing-2);
  border: 1px solid var(--ra-color-border-light);
  margin-bottom: var(--ra-spacing-1);
}
.rpu-item--row:hover {
  background: var(--ra-color-bg-hover);
}

/* ── Card mode ── */
.rpu-item--card {
  width: 104px;
  height: 104px;
  flex-direction: column;
  border: 1px solid var(--ra-color-border-light);
  overflow: hidden;
}
.rpu-item--card .rpu-item__info {
  display: none;
}
.rpu-item--card .rpu-item__actions {
  position: absolute;
  top: var(--ra-spacing-1);
  right: var(--ra-spacing-1);
  opacity: 0;
  transition: opacity var(--ra-transition-fast);
}
.rpu-item--card:hover .rpu-item__actions {
  opacity: 1;
}

/* ── Status colors ── */
.rpu-item--error {
  border-color: var(--ra-color-danger);
}
.rpu-item--success {
  border-color: var(--ra-color-success-border);
}
.rpu-item--uploading {
  border-color: var(--ra-color-brand-primary);
}

/* ── Thumbnail ── */
.rpu-item__thumb {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  border-radius: var(--ra-radius-sm);
}
.rpu-item--row .rpu-item__thumb {
  width: 40px;
  height: 40px;
}
.rpu-item--card .rpu-item__thumb {
  width: 100%;
  height: 100%;
}
.rpu-item__thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rpu-item__thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-tertiary);
}

/* ── Upload overlay ── */
.rpu-item__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.rpu-item__progress-ring {
  position: relative;
  width: 36px;
  height: 36px;
}
.rpu-item__ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.rpu-item__ring-bg {
  stroke: rgba(255, 255, 255, 0.3);
}
.rpu-item__ring-fill {
  stroke: #fff;
  stroke-linecap: round;
  transition: stroke-dasharray 0.2s;
}
.rpu-item__progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}

/* ── Info ── */
.rpu-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rpu-item__name {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpu-item__size {
  font-size: var(--ra-font-size-2xs);
  color: var(--ra-color-text-tertiary);
}
.rpu-item__error {
  font-size: var(--ra-font-size-2xs);
  color: var(--ra-color-danger);
}

/* ── Progress bar (text mode) ── */
.rpu-item__bar-wrap {
  height: 3px;
  background: var(--ra-color-bg-muted);
  border-radius: 2px;
  overflow: hidden;
}
.rpu-item__bar {
  height: 100%;
  background: var(--ra-color-brand-primary);
  transition: width 0.2s;
}

/* ── Actions ── */
.rpu-item__actions {
  display: flex;
  gap: var(--ra-spacing-1);
  flex-shrink: 0;
}
.rpu-item__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--ra-radius-sm);
  background: transparent;
  color: var(--ra-color-text-tertiary);
  cursor: pointer;
  transition:
    color var(--ra-transition-fast),
    background var(--ra-transition-fast);
  padding: 0;
}
.rpu-item__action:hover:not(:disabled) {
  background: var(--ra-color-bg-hover);
  color: var(--ra-color-text-primary);
}
.rpu-item__action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.rpu-item__action--remove:hover:not(:disabled) {
  color: var(--ra-color-danger);
}
.rpu-item__action:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 1px;
}
</style>
