<script setup lang="ts">
  import { computed } from 'vue'
  import { RProUpload, type ProUploadFileItem, type ProUploadPayloadContext } from '../pro-upload'
  import type { FormFieldSchema } from './types'

  const props = defineProps<{
    field: FormFieldSchema
    modelValue: unknown
    disabled?: boolean
    readonly?: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: unknown]
  }>()

  const files = computed<ProUploadFileItem[]>(() => {
    const value = props.modelValue
    if (Array.isArray(value)) {
      return value
        .map((item, index) => uploadValueToItem(item, index))
        .filter((item): item is ProUploadFileItem => item != null)
    }
    const item = uploadValueToItem(value, 0)
    return item ? [item] : []
  })

  const multiple = computed(() => (props.field.maxCount ?? 1) > 1)
  const listType = computed<'text' | 'picture' | 'picture-card'>(() =>
    props.field.mediaClass === 'image' ? 'picture-card' : 'text',
  )

  function uploadValueToItem(value: unknown, index: number): ProUploadFileItem | null {
    if (!value) return null
    if (typeof value === 'object') return value as ProUploadFileItem
    const storageId = String(value)
    return {
      uid: `${props.field.key}-${index}-${storageId}`,
      name: storageId,
      size: 0,
      type: props.field.accept || `${props.field.mediaClass || 'file'}/*`,
      status: 'success',
      progress: 100,
      storageId,
    }
  }

  function handleUpdate(list: ProUploadFileItem[]): void {
    if (props.field.type !== 'storage_id') {
      emit('update:modelValue', list)
      return
    }
    const storageIds = list
      .filter((item) => item.status === 'success' && item.storageId)
      .map((item) => item.storageId ?? '')
    emit('update:modelValue', multiple.value ? storageIds : (storageIds[0] ?? ''))
  }

  function buildUploadPayload(file: File, ctx: ProUploadPayloadContext): FormData {
    const formData = new FormData()
    formData.append('file', file)
    if (ctx.storage) formData.append('storage', ctx.storage)
    if (ctx.businessId) formData.append('business_id', ctx.businessId)
    if (ctx.businessType) formData.append('business_type', ctx.businessType)
    if (props.field.mediaClass) formData.append('media_class', props.field.mediaClass)
    return formData
  }
</script>

<template>
  <RProUpload
    :model-value="files"
    :multiple="multiple"
    :accept="field.accept"
    :max-count="field.maxCount ?? 1"
    :max-size-m-b="field.maxSizeMB"
    :disabled="disabled"
    :readonly="readonly"
    :storage="field.storage"
    :business-id="field.businessId"
    :business-type="field.businessType"
    :action="field.action"
    :headers="field.headers"
    :with-credentials="field.withCredentials"
    :list-type="listType"
    :build-upload-payload="buildUploadPayload"
    @update:model-value="handleUpdate"
  />
</template>
