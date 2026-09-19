<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import RModalDialog from '../modal-dialog/RModalDialog.vue'
  import {
    formatProUploadFileSize,
    resolveProUploadPreviewKind,
    resolveProUploadPreviewUrl,
  } from './preview'
  import type { ProUploadFileItem } from './types'

  defineOptions({ name: 'RProUploadPreviewDialog' })

  const props = defineProps<{
    visible: boolean
    file: ProUploadFileItem | null
  }>()

  const emit = defineEmits<{
    'update:visible': [visible: boolean]
  }>()

  const videoRef = ref<HTMLVideoElement | null>(null)
  const previewKind = computed(() => (props.file ? resolveProUploadPreviewKind(props.file) : null))
  const previewUrl = computed(() => (props.file ? resolveProUploadPreviewUrl(props.file) : ''))
  const title = computed(() => (previewKind.value === 'video' ? '视频预览' : '图片预览'))

  function stopVideo(): void {
    const video = videoRef.value
    if (!video) return
    video.pause()
    video.currentTime = 0
  }

  function updateVisible(visible: boolean): void {
    if (!visible) stopVideo()
    emit('update:visible', visible)
  }

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) stopVideo()
    },
  )

  onBeforeUnmount(stopVideo)
</script>

<template>
  <RModalDialog
    :visible="visible"
    :title="title"
    width="min(760px, calc(100vw - var(--ra-spacing-4) * 2))"
    :show-footer="false"
    @update:visible="updateVisible"
  >
    <div
      v-if="file && previewKind && previewUrl"
      class="rpu-preview"
      data-testid="pro-upload-preview"
    >
      <img
        v-if="previewKind === 'image'"
        :src="previewUrl"
        :alt="file.name"
        class="rpu-preview__image rpu__preview-img"
        data-testid="pro-upload-preview-image"
      />
      <video
        v-else
        ref="videoRef"
        :src="previewUrl"
        :poster="file.posterUrl"
        class="rpu-preview__video"
        controls
        playsinline
        preload="metadata"
        data-testid="pro-upload-preview-video"
      >
        当前浏览器不支持视频播放。
      </video>

      <div class="rpu-preview__meta">
        <span class="rpu-preview__name" :title="file.name">{{ file.name }}</span>
        <span class="rpu-preview__size">{{ formatProUploadFileSize(file.size) }}</span>
      </div>
    </div>
  </RModalDialog>
</template>

<style scoped>
  .rpu-preview {
    display: grid;
    gap: var(--ra-spacing-3);
  }

  .rpu-preview__image,
  .rpu-preview__video {
    display: block;
    max-width: 100%;
    max-height: min(68vh, 720px);
    margin: 0 auto;
    background: var(--ra-color-bg-code);
    object-fit: contain;
  }

  .rpu-preview__video {
    width: 100%;
  }

  .rpu-preview__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ra-spacing-3);
    min-width: 0;
    color: var(--ra-color-text-secondary);
    font-size: var(--ra-font-size-xs);
  }

  .rpu-preview__name {
    min-width: 0;
    overflow: hidden;
    color: var(--ra-color-text-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rpu-preview__size {
    flex-shrink: 0;
    color: var(--ra-color-text-tertiary);
  }
</style>
