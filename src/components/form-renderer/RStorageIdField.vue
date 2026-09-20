<script setup lang="ts">
  import { computed } from 'vue'
  import {
    RProUpload,
    defaultUploadRequest,
    type ProUploadFileItem,
    type ProUploadRequestOptions,
  } from '../pro-upload'
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

  // Schema 驱动的 storage_id 字段是合同认可的保留通道：
  // 策略字段来自字段 schema（field.storage / field.businessType），不是页面 props。
  function schemaUploadRequest(options: ProUploadRequestOptions): void {
    const { formData } = options
    if (props.field.storage) formData.append('storage', props.field.storage)
    if (props.field.businessId) formData.append('business_id', props.field.businessId)
    if (props.field.businessType) formData.append('business_type', props.field.businessType)
    if (props.field.mediaClass) formData.append('media_class', props.field.mediaClass)
    defaultUploadRequest(
      {
        action: props.field.action,
        method: 'POST',
        headers: props.field.headers,
        withCredentials: props.field.withCredentials ?? false,
      },
      options,
    )
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
    :list-type="listType"
    :custom-request="schemaUploadRequest"
    @update:model-value="handleUpdate"
  />
</template>
