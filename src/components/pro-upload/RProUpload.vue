<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import type { ProUploadProps, ProUploadFileItem, ProUploadLocale, ProUploadExpose } from './types'
import { defaultLocale } from './types'
import { useUploadCore, revokeThumbUrls } from './useUploadCore'
import RProUploadItem from './RProUploadItem.vue'

const props = withDefaults(defineProps<ProUploadProps>(), {
  multiple: false,
  disabled: false,
  readonly: false,
  draggable: true,
  concurrency: 3,
  listType: 'picture-card',
  maxCount: undefined,
  maxSizeMB: undefined,
  accept: undefined,
  storage: undefined,
  category: undefined,
  businessId: undefined,
  businessType: undefined,
  customRequest: undefined,
  beforeUpload: undefined,
  buildUploadPayload: undefined,
  parseResponse: undefined,
  renderItem: undefined,
  locale: () => ({}),
  retryConfig: () => ({ maxRetries: 2, retryDelay: 1000 }),
  value: undefined,
})

const emit = defineEmits<{
  (e: 'change', fileList: ProUploadFileItem[]): void
  (e: 'update:value', fileList: ProUploadFileItem[]): void
  (e: 'success', file: ProUploadFileItem, response: unknown): void
  (e: 'error', file: ProUploadFileItem, error: Error): void
  (e: 'preview', file: ProUploadFileItem): void
  (e: 'remove', file: ProUploadFileItem): void
  (
    e: 'exceed',
    info: { type: 'count' | 'size' | 'accept'; file: File; limit: number | string },
  ): void
}>()

function t(key: keyof ProUploadLocale): string {
  return props.locale[key] ?? defaultLocale[key] ?? key
}

const { fileList, addFiles, removeFile, retryFile, abortFile, clear, submit } = useUploadCore({
  props,
  emit: {
    change: (list) => emit('change', list),
    updateValue: (list) => emit('update:value', list),
    success: (file, resp) => emit('success', file, resp),
    error: (file, err) => emit('error', file, err),
    exceed: (info) => emit('exceed', info),
    remove: (file) => emit('remove', file),
  },
})

const inputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const previewVisible = ref(false)
const previewUrl = ref('')
const previewAlt = ref('')

const showTrigger = computed(() => {
  if (props.readonly) return false
  if (props.maxCount !== undefined) {
    return fileList.value.filter((f) => f.status !== 'error').length < props.maxCount
  }
  return true
})

const isCard = computed(() => props.listType === 'picture-card')

function openFileDialog() {
  if (props.disabled || props.readonly) return
  inputRef.value?.click()
}

function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  addFiles(Array.from(input.files))
  input.value = ''
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  if (props.disabled || props.readonly) return
  isDragOver.value = true
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  if (props.disabled || props.readonly) return
  const files = e.dataTransfer?.files
  if (!files?.length) return
  addFiles(Array.from(files))
}

function handlePaste(e: ClipboardEvent) {
  if (props.disabled || props.readonly) return
  const files = e.clipboardData?.files
  if (!files?.length) return
  e.preventDefault()
  addFiles(Array.from(files))
}

function handlePreview(file: ProUploadFileItem) {
  const url = file.url ?? file.thumbUrl
  if (url) {
    previewUrl.value = url
    previewAlt.value = file.name
    previewVisible.value = true
  }
  emit('preview', file)
}

function closePreview() {
  previewVisible.value = false
}

function handlePreviewKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePreview()
}

onBeforeUnmount(() => {
  revokeThumbUrls(fileList.value)
})

defineExpose<ProUploadExpose>({
  submit,
  clear,
  abort: abortFile,
  retry: retryFile,
  getFileList: () => fileList.value,
})
</script>

<template>
  <div
    class="rpu"
    :class="{ 'rpu--disabled': disabled, 'rpu--readonly': readonly }"
    data-testid="pro-upload"
    @paste="handlePaste"
  >
    <!-- Hidden file input -->
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      class="rpu__input"
      tabindex="-1"
      aria-hidden="true"
      data-testid="pro-upload-input"
      @change="handleInputChange"
    />

    <!-- Card layout: items + trigger in grid -->
    <div v-if="isCard" class="rpu__card-grid" role="list" aria-label="已上传文件">
      <template v-for="file in fileList" :key="file.uid">
        <slot name="fileItem" :file="file">
          <component
            :is="renderItem != null ? () => renderItem!({ file }) : RProUploadItem"
            v-bind="renderItem != null ? {} : { file, listType, disabled, readonly, locale }"
            @remove="removeFile"
            @retry="retryFile"
            @preview="handlePreview"
          />
        </slot>
      </template>

      <!-- Trigger card -->
      <div
        v-if="showTrigger"
        class="rpu__trigger-card"
        :class="{ 'rpu__trigger-card--drag-over': isDragOver }"
        role="button"
        tabindex="0"
        :aria-label="t('clickHint')"
        :aria-disabled="disabled"
        data-testid="pro-upload-trigger"
        @click="openFileDialog"
        @keydown.enter.space.prevent="openFileDialog"
        @dragenter="handleDragEnter"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <slot name="trigger">
          <div class="rpu__trigger-content">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="rpu__trigger-icon"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span class="rpu__trigger-text">{{ t('clickHint') }}</span>
          </div>
        </slot>
      </div>
    </div>

    <!-- List layout: trigger zone + list below -->
    <template v-else>
      <div
        v-if="showTrigger && draggable"
        class="rpu__drop-zone"
        :class="{ 'rpu__drop-zone--drag-over': isDragOver }"
        role="button"
        tabindex="0"
        :aria-label="`${t('dropHint')} ${t('clickHint')}`"
        :aria-disabled="disabled"
        data-testid="pro-upload-trigger"
        @click="openFileDialog"
        @keydown.enter.space.prevent="openFileDialog"
        @dragenter="handleDragEnter"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <slot name="trigger">
          <div class="rpu__drop-content">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="rpu__drop-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span class="rpu__drop-text"
              >{{ t('dropHint') }}<span class="rpu__drop-link">{{ t('clickHint') }}</span></span
            >
          </div>
        </slot>
      </div>

      <button
        v-else-if="showTrigger"
        type="button"
        class="rpu__btn-trigger"
        :disabled="disabled"
        data-testid="pro-upload-trigger"
        @click="openFileDialog"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {{ t('clickHint') }}
      </button>

      <slot name="tip" />

      <div v-if="fileList.length" class="rpu__list" role="list" aria-label="已上传文件">
        <template v-for="file in fileList" :key="file.uid">
          <slot name="fileItem" :file="file">
            <RProUploadItem
              :file="file"
              :list-type="listType"
              :disabled="disabled"
              :readonly="readonly"
              :locale="locale"
              @remove="removeFile"
              @retry="retryFile"
              @preview="handlePreview"
            />
          </slot>
        </template>
      </div>
    </template>

    <!-- Preview modal -->
    <Teleport to="body">
      <Transition name="rpu-fade">
        <div
          v-if="previewVisible"
          class="rpu__preview-mask"
          role="dialog"
          aria-modal="true"
          :aria-label="`预览: ${previewAlt}`"
          data-testid="pro-upload-preview"
          @click="closePreview"
          @keydown="handlePreviewKeydown"
        >
          <div class="rpu__preview-body" @click.stop>
            <img :src="previewUrl" :alt="previewAlt" class="rpu__preview-img" />
            <button
              type="button"
              class="rpu__preview-close"
              aria-label="关闭预览"
              @click="closePreview"
            >
              <svg
                width="20"
                height="20"
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
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.rpu {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
  width: 100%;
}
.rpu--disabled {
  opacity: 0.5;
  pointer-events: none;
}
.rpu--readonly {
  pointer-events: auto;
}

.rpu__input {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
}

/* ── Card grid ── */
.rpu__card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ra-spacing-2);
}

/* ── Trigger card ── */
.rpu__trigger-card {
  width: 104px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  cursor: pointer;
  transition:
    border-color var(--ra-transition-fast),
    background var(--ra-transition-fast);
}
.rpu__trigger-card:hover,
.rpu__trigger-card--drag-over {
  border-color: var(--ra-color-brand-primary);
  background: var(--ra-color-brand-subtle);
}
.rpu__trigger-card:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}
.rpu__trigger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ra-spacing-1);
}
.rpu__trigger-icon {
  color: var(--ra-color-text-tertiary);
}
.rpu__trigger-text {
  font-size: var(--ra-font-size-2xs);
  color: var(--ra-color-text-tertiary);
}

/* ── Drop zone ── */
.rpu__drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ra-spacing-6) var(--ra-spacing-4);
  border: 1px dashed var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  cursor: pointer;
  transition:
    border-color var(--ra-transition-fast),
    background var(--ra-transition-fast);
}
.rpu__drop-zone:hover,
.rpu__drop-zone--drag-over {
  border-color: var(--ra-color-brand-primary);
  background: var(--ra-color-brand-subtle);
}
.rpu__drop-zone:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}
.rpu__drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ra-spacing-2);
}
.rpu__drop-icon {
  color: var(--ra-color-text-tertiary);
}
.rpu__drop-text {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-secondary);
}
.rpu__drop-link {
  color: var(--ra-color-brand-primary);
  margin-left: 4px;
  cursor: pointer;
}

/* ── Button trigger ── */
.rpu__btn-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  padding: var(--ra-spacing-1-5) var(--ra-spacing-3);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  cursor: pointer;
  transition:
    border-color var(--ra-transition-fast),
    background var(--ra-transition-fast);
}
.rpu__btn-trigger:hover:not(:disabled) {
  border-color: var(--ra-color-brand-primary);
  color: var(--ra-color-brand-primary);
}
.rpu__btn-trigger:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}

/* ── File list ── */
.rpu__list {
  display: flex;
  flex-direction: column;
}

/* ── Preview modal ── */
.rpu__preview-mask {
  position: fixed;
  inset: 0;
  z-index: var(--ra-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
}
.rpu__preview-body {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}
.rpu__preview-img {
  max-width: 100%;
  max-height: 85vh;
  border-radius: var(--ra-radius-md);
  object-fit: contain;
}
.rpu__preview-close {
  position: absolute;
  top: -36px;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
  transition: background var(--ra-transition-fast);
}
.rpu__preview-close:hover {
  background: rgba(255, 255, 255, 0.4);
}
.rpu__preview-close:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
}

/* ── Transitions ── */
.rpu-fade-enter-active,
.rpu-fade-leave-active {
  transition: opacity 0.2s ease;
}
.rpu-fade-enter-from,
.rpu-fade-leave-to {
  opacity: 0;
}
</style>
