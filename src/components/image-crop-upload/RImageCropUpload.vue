<script setup lang="ts">
  import { ref } from 'vue'
  import RProUpload from '../pro-upload/RProUpload.vue'
  import type { ProUploadExpose, ProUploadFileItem } from '../pro-upload/types'
  import RImageCropperDialog from './RImageCropperDialog.vue'
  import { useCropTransform } from './useCropTransform'
  import type { ImageCropResult, ImageCropUploadProps } from './types'

  defineOptions({ name: 'RImageCropUpload' })

  type UploadExceedInfo = { type: 'count' | 'size' | 'accept'; file: File; limit: number | string }

  const props = withDefaults(defineProps<ImageCropUploadProps>(), {
    crop: true,
    cropOptions: () => ({}),
    cropLocale: () => ({}),
    multiple: false,
    disabled: false,
    readonly: false,
    draggable: true,
    concurrency: 3,
    listType: 'picture-card',
    maxCount: undefined,
    maxSizeMB: undefined,
    accept: undefined,
    action: '/api/files/upload',
    method: 'POST',
    headers: undefined,
    withCredentials: false,
    customRequest: undefined,
    beforeUpload: undefined,
    transformFile: undefined,
    parseResponse: undefined,
    renderItem: undefined,
    locale: () => ({}),
    retryConfig: () => ({ maxRetries: 2, retryDelay: 1000 }),
    value: undefined,
    modelValue: undefined,
  })

  const emit = defineEmits<{
    (e: 'change', fileList: ProUploadFileItem[]): void
    (e: 'update:value', fileList: ProUploadFileItem[]): void
    (e: 'update:modelValue', fileList: ProUploadFileItem[]): void
    (e: 'success', file: ProUploadFileItem, response: unknown): void
    (e: 'error', file: ProUploadFileItem, error: Error): void
    (e: 'preview', file: ProUploadFileItem): void
    (e: 'remove', file: ProUploadFileItem): void
    (e: 'exceed', info: UploadExceedInfo): void
    (e: 'crop-success', result: ImageCropResult): void
    (e: 'crop-cancel', file: File): void
    (e: 'crop-error', error: Error): void
  }>()

  const uploadRef = ref<ProUploadExpose | null>(null)

  const {
    cropDialogVisible,
    cropSourceFile,
    handleTransformFile,
    handleCropConfirm,
    handleCropCancel,
    handleCropError,
  } = useCropTransform({
    enabled: () => Boolean(props.crop),
    next: () => props.transformFile,
    unmountRejectMessage: 'Image crop upload unmounted',
    onConfirm: (result) => emit('crop-success', result),
    onCancel: (file) => emit('crop-cancel', file),
    onError: (error) => emit('crop-error', error),
  })

  function forwardChange(fileList: ProUploadFileItem[]): void {
    emit('change', fileList)
  }

  function forwardUpdateValue(fileList: ProUploadFileItem[]): void {
    emit('update:value', fileList)
  }

  function forwardUpdateModelValue(fileList: ProUploadFileItem[]): void {
    emit('update:modelValue', fileList)
  }

  function forwardSuccess(file: ProUploadFileItem, response: unknown): void {
    emit('success', file, response)
  }

  function forwardError(file: ProUploadFileItem, error: Error): void {
    emit('error', file, error)
  }

  function forwardPreview(file: ProUploadFileItem): void {
    emit('preview', file)
  }

  function forwardRemove(file: ProUploadFileItem): void {
    emit('remove', file)
  }

  function forwardExceed(info: UploadExceedInfo): void {
    emit('exceed', info)
  }

  function submit(): void {
    uploadRef.value?.submit()
  }

  function clear(): void {
    uploadRef.value?.clear()
  }

  function abort(uid: string): void {
    uploadRef.value?.abort(uid)
  }

  function retry(uid: string): void {
    uploadRef.value?.retry(uid)
  }

  defineExpose<ProUploadExpose>({
    submit,
    clear,
    abort,
    retry,
    getFileList: () => uploadRef.value?.getFileList() ?? [],
  })
</script>

<template>
  <div class="ricu" data-testid="image-crop-upload">
    <RProUpload
      ref="uploadRef"
      :value="value"
      :model-value="modelValue"
      :multiple="multiple"
      :accept="accept"
      :max-count="maxCount"
      :max-size-m-b="maxSizeMB"
      :disabled="disabled"
      :readonly="readonly"
      :draggable="draggable"
      :concurrency="concurrency"
      :retry-config="retryConfig"
      :action="action"
      :method="method"
      :headers="headers"
      :with-credentials="withCredentials"
      :list-type="listType"
      :custom-request="customRequest"
      :before-upload="beforeUpload"
      :transform-file="handleTransformFile"
      :parse-response="parseResponse"
      :render-item="renderItem"
      :locale="locale"
      @change="forwardChange"
      @update:value="forwardUpdateValue"
      @update:model-value="forwardUpdateModelValue"
      @success="forwardSuccess"
      @error="forwardError"
      @preview="forwardPreview"
      @remove="forwardRemove"
      @exceed="forwardExceed"
    >
      <template v-if="$slots.trigger" #trigger>
        <slot name="trigger" />
      </template>
      <template v-if="$slots.tip" #tip>
        <slot name="tip" />
      </template>
      <template v-if="$slots.fileItem" #fileItem="{ file }">
        <slot name="fileItem" :file="file" />
      </template>
    </RProUpload>

    <RImageCropperDialog
      v-model:visible="cropDialogVisible"
      :file="cropSourceFile"
      :options="cropOptions"
      :locale="cropLocale"
      @confirm="handleCropConfirm"
      @cancel="handleCropCancel"
      @error="handleCropError"
    />
  </div>
</template>
