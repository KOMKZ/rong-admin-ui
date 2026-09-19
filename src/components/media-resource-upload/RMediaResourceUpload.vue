<script setup lang="ts">
  import { ref, watch } from 'vue'
  import RProUpload from '../pro-upload/RProUpload.vue'
  import type { ProUploadFileItem, ProUploadPayloadContext } from '../pro-upload/types'
  import { mediaResourceToUploadFile, uploadFileToMediaResource } from './mediaResourceAdapter'
  import type {
    MediaResourceUploadEmits,
    MediaResourceUploadProps,
    MediaResourceUploadSlots,
  } from './types'

  defineOptions({ name: 'RMediaResourceUpload' })

  const props = withDefaults(defineProps<MediaResourceUploadProps>(), {
    modelValue: null,
    generateThumbnail: false,
    timeoutMs: 120000,
    accept: undefined,
    maxSizeMB: undefined,
    disabled: false,
    readonly: false,
    draggable: true,
    action: '/api/files/upload',
    headers: undefined,
    withCredentials: false,
    businessId: undefined,
    businessType: undefined,
    listType: 'picture-card',
    customRequest: undefined,
    dataTestid: 'media-resource-upload',
  })
  const emit = defineEmits<MediaResourceUploadEmits>()
  defineSlots<MediaResourceUploadSlots>()
  const files = ref<ProUploadFileItem[]>([])

  watch(
    () => props.modelValue,
    (resource) => {
      if (hasActiveUpload(files.value)) return
      files.value = resource ? [mediaResourceToUploadFile(resource)] : []
    },
    { immediate: true, deep: true },
  )

  function buildUploadPayload(file: File, context: ProUploadPayloadContext): FormData {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('storage', context.storage ?? props.storage)
    formData.append('media_class', props.mediaClass)
    formData.append('include_media_info', 'true')
    if (props.generateThumbnail) formData.append('generate_thumbnail', 'true')
    if (context.businessId) formData.append('business_id', context.businessId)
    if (context.businessType) formData.append('business_type', context.businessType)
    return formData
  }

  function handleUpdate(list: ProUploadFileItem[]): void {
    files.value = list
  }

  function handleSuccess(file: ProUploadFileItem, response: unknown): void {
    try {
      const resource = uploadFileToMediaResource(file, props.mediaClass, response)
      files.value = [mediaResourceToUploadFile(resource)]
      emit('update:modelValue', resource)
      emit('success', resource, file, response)
    } catch (error) {
      const contractError = error instanceof Error ? error : new Error(String(error))
      files.value = [{ ...file, status: 'error', error: contractError.message }]
      emit('error', file, contractError)
    }
  }

  function handleError(file: ProUploadFileItem, error: Error): void {
    files.value = files.value.map((current) =>
      current.uid === file.uid
        ? { ...current, status: 'error', error: error.message }
        : current,
    )
    emit('error', file, error)
  }

  function handleRemove(): void {
    const previous = props.modelValue ?? null
    files.value = []
    emit('update:modelValue', null)
    emit('remove', previous)
  }

  function hasActiveUpload(list: ProUploadFileItem[]): boolean {
    return list.some((file) => ['pending', 'queued', 'uploading'].includes(file.status))
  }
</script>

<template>
  <div :data-testid="dataTestid">
    <RProUpload
      v-model:model-value="files"
      :multiple="false"
      :max-count="1"
      :accept="accept"
      :max-size-m-b="maxSizeMB"
      :disabled="disabled"
      :readonly="readonly"
      :draggable="draggable"
      :storage="storage"
      :action="action"
      :headers="headers"
      :with-credentials="withCredentials"
      :timeout-ms="timeoutMs"
      :business-id="businessId"
      :business-type="businessType"
      :list-type="listType"
      :custom-request="customRequest"
      :build-upload-payload="buildUploadPayload"
      @update:model-value="handleUpdate"
      @success="handleSuccess"
      @error="handleError"
      @remove="handleRemove"
    >
      <template v-if="$slots.tip" #tip><slot name="tip" /></template>
    </RProUpload>
  </div>
</template>
