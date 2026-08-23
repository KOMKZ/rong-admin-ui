<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
  import { NButton, NButtonGroup, NCard, NModal, NSpace, NSpin } from 'naive-ui'
  import { RIcon } from '../icon'
  import type { ImageCropOptions, ImageCropResult, ImageCropLocale } from './types'
  import { canvasToFile, validateImageDimensions } from './cropper-utils'
  import { defaultImageCropLocale } from './types'
  import type CropperType from 'cropperjs'

  defineOptions({ name: 'RImageCropperDialog' })

  const props = withDefaults(
    defineProps<{
      visible: boolean
      file?: File
      options?: ImageCropOptions
      locale?: Partial<ImageCropLocale>
    }>(),
    {
      file: undefined,
      options: () => ({}),
      locale: () => ({}),
    },
  )

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm', result: ImageCropResult): void
    (e: 'cancel'): void
    (e: 'error', error: Error): void
  }>()

  const sourceUrl = ref('')
  const sourceImageRef = ref<HTMLImageElement | null>(null)
  const cropperHostRef = ref<HTMLElement | null>(null)
  const loading = ref(false)
  const exportLoading = ref(false)
  const errorText = ref('')
  const imageMoveStep = 12

  type CropperInstance = InstanceType<typeof CropperType>

  let cropper: CropperInstance | null = null
  let cropperCtorPromise: Promise<typeof CropperType> | null = null

  const t = computed(() => ({
    ...defaultImageCropLocale,
    ...props.locale,
  }))

  function buildCropperTemplate(): string {
    const aspectRatio = props.options.aspectRatio ?? NaN
    const aspectRatioAttr = Number.isFinite(aspectRatio) ? ` aspect-ratio="${aspectRatio}"` : ''

    return `
    <cropper-canvas background scale-step="0.08">
      <cropper-image rotatable scalable translatable></cropper-image>
      <cropper-shade></cropper-shade>
      <cropper-handle action="move" plain></cropper-handle>
      <cropper-selection${aspectRatioAttr} outlined>
        <cropper-grid role="grid"></cropper-grid>
        <cropper-crosshair centered></cropper-crosshair>
      </cropper-selection>
    </cropper-canvas>
  `
  }

  function revokeSourceUrl(): void {
    if (sourceUrl.value) {
      URL.revokeObjectURL(sourceUrl.value)
      sourceUrl.value = ''
    }
  }

  function destroyCropper(): void {
    cropper?.destroy()
    cropper = null
  }

  async function loadCropper(): Promise<typeof CropperType> {
    cropperCtorPromise ??= import('cropperjs').then((module) => module.default)
    return cropperCtorPromise
  }

  function resetState(): void {
    destroyCropper()
    revokeSourceUrl()
    loading.value = false
    exportLoading.value = false
    errorText.value = ''
  }

  function closeDialog(): void {
    emit('update:visible', false)
  }

  function handleCancel(): void {
    closeDialog()
    emit('cancel')
  }

  function handleModalUpdate(value: boolean): void {
    if (value) {
      emit('update:visible', true)
      return
    }
    handleCancel()
  }

  async function initCropper(): Promise<void> {
    const image = sourceImageRef.value
    const host = cropperHostRef.value
    if (!props.visible || !image || !host || !props.file || cropper) return

    if (!validateImageDimensions(image, props.options)) {
      const err = new Error(t.value.invalidImage)
      errorText.value = err.message
      loading.value = false
      emit('error', err)
      return
    }

    await nextTick()
    const Cropper = await loadCropper()
    if (!props.visible || !sourceImageRef.value || cropper) {
      loading.value = false
      return
    }

    cropper = new Cropper(image, {
      container: host,
      template: buildCropperTemplate(),
    })
    await fitCropperToStage()
    loading.value = false
  }

  function handleImageLoad(): void {
    void initCropper()
  }

  function getCropperImage() {
    return cropper?.getCropperImage()
  }

  function getStageSize(): { width: number; height: number } {
    const host = cropperHostRef.value
    if (!host) return { width: 0, height: 0 }
    const rect = host.getBoundingClientRect()
    return {
      width: rect.width || host.clientWidth,
      height: rect.height || host.clientHeight,
    }
  }

  function getFixedCropBoxSize(stageWidth: number, stageHeight: number) {
    const aspectRatio = props.options.aspectRatio
    const maxWidth = Math.max(1, stageWidth * 0.88)
    const maxHeight = Math.max(1, stageHeight * 0.88)
    let cropWidth = props.options.cropBoxWidth ?? stageWidth * 0.72
    let cropHeight = props.options.cropBoxHeight ?? stageHeight * 0.72

    if (
      !props.options.cropBoxHeight &&
      aspectRatio &&
      Number.isFinite(aspectRatio) &&
      aspectRatio > 0
    ) {
      cropHeight = cropWidth / aspectRatio
    } else if (
      !props.options.cropBoxWidth &&
      aspectRatio &&
      Number.isFinite(aspectRatio) &&
      aspectRatio > 0
    ) {
      cropWidth = cropHeight * aspectRatio
    }

    cropWidth = Math.min(Math.max(1, cropWidth), maxWidth)
    cropHeight = Math.min(Math.max(1, cropHeight), maxHeight)

    if (aspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0) {
      if (cropWidth / cropHeight > aspectRatio) {
        cropWidth = cropHeight * aspectRatio
      } else {
        cropHeight = cropWidth / aspectRatio
      }
    }

    return { width: cropWidth, height: cropHeight }
  }

  async function fitCropperToStage(): Promise<void> {
    const image = cropper?.getCropperImage()
    const selection = cropper?.getCropperSelection()
    if (!image || !selection) return

    await image.$ready()
    image.$resetTransform().$center('cover')

    await nextTick()
    const { width: stageWidth, height: stageHeight } = getStageSize()
    if (stageWidth <= 0 || stageHeight <= 0) return

    const aspectRatio = props.options.aspectRatio
    const { width: cropWidth, height: cropHeight } = getFixedCropBoxSize(stageWidth, stageHeight)

    selection.$change(
      (stageWidth - cropWidth) / 2,
      (stageHeight - cropHeight) / 2,
      cropWidth,
      cropHeight,
      aspectRatio,
      true,
    )
  }

  function zoomIn(): void {
    getCropperImage()?.$zoom(0.1)
  }

  function zoomOut(): void {
    getCropperImage()?.$zoom(-0.1)
  }

  function moveImage(offsetX: number, offsetY: number): void {
    getCropperImage()?.$move(offsetX, offsetY)
  }

  function rotateLeft(): void {
    getCropperImage()?.$rotate('-90deg')
  }

  function rotateRight(): void {
    getCropperImage()?.$rotate('90deg')
  }

  function resetCropper(): void {
    void fitCropperToStage()
  }

  async function handleConfirm(): Promise<void> {
    if (!cropper || !props.file) return
    const selection = cropper.getCropperSelection()
    if (!selection) {
      const err = new Error(t.value.exportFailed)
      errorText.value = err.message
      emit('error', err)
      return
    }

    exportLoading.value = true
    try {
      const canvas = await selection.$toCanvas({
        width: props.options.outputWidth,
        height: props.options.outputHeight,
      })
      const file = await canvasToFile(canvas, props.file, props.options)
      emit('confirm', {
        file,
        sourceFile: props.file,
        canvas,
      })
      closeDialog()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(t.value.exportFailed)
      errorText.value = err.message
      emit('error', err)
    } finally {
      exportLoading.value = false
    }
  }

  watch(
    () => [props.visible, props.file] as const,
    async ([visible, file]) => {
      resetState()
      if (!visible || !file) return

      loading.value = true
      sourceUrl.value = URL.createObjectURL(file)
      await nextTick()
      if (sourceImageRef.value?.complete) {
        await initCropper()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    resetState()
  })
</script>

<template>
  <NModal
    :show="visible"
    :auto-focus="true"
    :trap-focus="true"
    :mask-closable="false"
    :close-on-esc="true"
    data-testid="image-cropper-dialog"
    @update:show="handleModalUpdate"
    @esc="handleCancel"
  >
    <NCard
      :title="t.title"
      class="ricd"
      role="dialog"
      aria-modal="true"
      :aria-label="t.title"
      :bordered="false"
      closable
      @close="handleCancel"
    >
      <NSpin :show="loading">
        <div class="ricd__body">
          <div
            ref="cropperHostRef"
            class="ricd__stage"
            :class="{ 'ricd__stage--round': options.circularPreview }"
            data-testid="image-cropper-stage"
          >
            <img
              v-if="sourceUrl"
              ref="sourceImageRef"
              :src="sourceUrl"
              :alt="file?.name ?? t.title"
              class="ricd__source"
              @load="handleImageLoad"
            />
          </div>

          <p v-if="errorText" class="ricd__error" role="alert" data-testid="image-cropper-error">
            {{ errorText }}
          </p>

          <div class="ricd__toolbar" aria-label="裁切工具栏">
            <NButton
              tertiary
              size="small"
              :aria-label="t.zoomOutText"
              data-testid="image-cropper-zoom-out"
              @click="zoomOut"
            >
              <template #icon><RIcon name="zoom-out" size="sm" /></template>
              {{ t.zoomOutText }}
            </NButton>
            <NButton
              tertiary
              size="small"
              :aria-label="t.zoomInText"
              data-testid="image-cropper-zoom-in"
              @click="zoomIn"
            >
              <template #icon><RIcon name="zoom-in" size="sm" /></template>
              {{ t.zoomInText }}
            </NButton>
            <NButtonGroup size="small" data-testid="image-cropper-move-group">
              <NButton
                tertiary
                :aria-label="t.moveLeftText"
                data-testid="image-cropper-move-left"
                @click="moveImage(-imageMoveStep, 0)"
              >
                <template #icon><RIcon name="arrow-left" size="sm" /></template>
              </NButton>
              <NButton
                tertiary
                :aria-label="t.moveUpText"
                data-testid="image-cropper-move-up"
                @click="moveImage(0, -imageMoveStep)"
              >
                <template #icon><RIcon name="arrow-up" size="sm" /></template>
              </NButton>
              <NButton
                tertiary
                :aria-label="t.moveDownText"
                data-testid="image-cropper-move-down"
                @click="moveImage(0, imageMoveStep)"
              >
                <template #icon><RIcon name="arrow-down" size="sm" /></template>
              </NButton>
              <NButton
                tertiary
                :aria-label="t.moveRightText"
                data-testid="image-cropper-move-right"
                @click="moveImage(imageMoveStep, 0)"
              >
                <template #icon><RIcon name="arrow-right" size="sm" /></template>
              </NButton>
            </NButtonGroup>
            <NButton
              tertiary
              size="small"
              :aria-label="t.rotateLeftText"
              data-testid="image-cropper-rotate-left"
              @click="rotateLeft"
            >
              <template #icon><RIcon name="rotate-ccw" size="sm" /></template>
              {{ t.rotateLeftText }}
            </NButton>
            <NButton
              tertiary
              size="small"
              :aria-label="t.rotateRightText"
              data-testid="image-cropper-rotate-right"
              @click="rotateRight"
            >
              <template #icon><RIcon name="rotate-cw" size="sm" /></template>
              {{ t.rotateRightText }}
            </NButton>
            <NButton
              tertiary
              size="small"
              :aria-label="t.resetText"
              data-testid="image-cropper-reset"
              @click="resetCropper"
            >
              <template #icon><RIcon name="refresh-cw" size="sm" /></template>
              {{ t.resetText }}
            </NButton>
          </div>
        </div>
      </NSpin>

      <template #footer>
        <NSpace justify="end">
          <NButton data-testid="image-cropper-cancel" @click="handleCancel">
            {{ t.cancelText }}
          </NButton>
          <NButton
            type="primary"
            :loading="exportLoading"
            :disabled="Boolean(errorText) || loading"
            data-testid="image-cropper-confirm"
            @click="handleConfirm"
          >
            <template #icon><RIcon name="scissors" size="sm" /></template>
            {{ t.confirmText }}
          </NButton>
        </NSpace>
      </template>
    </NCard>
  </NModal>
</template>

<style scoped>
  .ricd {
    width: min(720px, 92vw);
  }

  .ricd__body {
    display: flex;
    flex-direction: column;
    gap: var(--ra-spacing-3);
  }

  .ricd__stage {
    position: relative;
    height: min(58vh, 480px);
    min-height: 320px;
    overflow: hidden;
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-md);
    background-color: #f8fafc;
    background-image:
      linear-gradient(45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(15, 23, 42, 0.1) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(15, 23, 42, 0.1) 75%);
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
    background-size: 16px 16px;
  }

  .ricd__stage:focus-within {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .ricd__stage :deep(cropper-canvas) {
    width: 100%;
    height: 100%;
  }

  .ricd__stage :deep(cropper-image) {
    cursor: grab;
  }

  .ricd__stage :deep(cropper-image:active) {
    cursor: grabbing;
  }

  .ricd__stage :deep(cropper-shade) {
    background-color: rgba(15, 23, 42, 0.5);
  }

  .ricd__stage :deep(cropper-selection) {
    background: transparent;
    outline-color: var(--ra-color-brand-primary);
    cursor: default;
    pointer-events: none;
  }

  .ricd__stage :deep(cropper-grid) {
    border-color: rgba(255, 255, 255, 0.72);
    pointer-events: none;
  }

  .ricd__stage :deep(cropper-handle) {
    width: 14px;
    height: 14px;
    background-color: var(--ra-color-brand-primary);
    border: 2px solid #fff;
    opacity: 1;
  }

  .ricd__stage :deep(cropper-handle[plain]) {
    width: 100%;
    height: 100%;
    background: transparent;
    border: 0;
    cursor: grab;
  }

  .ricd__stage :deep(cropper-handle[plain]:active) {
    cursor: grabbing;
  }

  .ricd__stage--round :deep(cropper-selection) {
    border-radius: var(--ra-radius-full);
  }

  .ricd__source {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .ricd__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ra-spacing-2);
    align-items: center;
  }

  .ricd__error {
    margin: 0;
    color: var(--ra-color-danger);
    font-size: var(--ra-font-size-sm);
    line-height: var(--ra-line-height-base);
  }

  @media (max-width: 768px) {
    .ricd {
      width: 94vw;
    }

    .ricd__stage {
      height: 48vh;
      min-height: 260px;
    }
  }
</style>
