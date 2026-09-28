<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
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

  const files = ref<ProUploadFileItem[]>([])

  watch(
    () => props.modelValue,
    (value) => {
      if (hasActiveUpload(files.value)) return
      files.value = normalizeUploadValue(value)
    },
    { immediate: true, deep: true },
  )

  const multiple = computed(() => (props.field.maxCount ?? 1) > 1)
  const listType = computed<'text' | 'picture' | 'picture-card'>(() =>
    props.field.mediaClass === 'image' ? 'picture-card' : 'text',
  )

  function uploadValueToItem(value: unknown, index: number): ProUploadFileItem | null {
    if (!value) return null
    if (typeof value === 'object') return value as ProUploadFileItem
    const storageId = String(value)
    const projected = files.value.find((item) => item.storageId === storageId && item.url)
    if (projected) return projected
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
    files.value = list
    if (props.field.type !== 'storage_id') {
      emit('update:modelValue', list)
      return
    }
    if (hasActiveUpload(list)) return
    const storageIds = list
      .filter((item) => item.status === 'success' && item.storageId)
      .map((item) => item.storageId ?? '')
    if (storageIds.length === 0 && list.some((item) => item.status === 'error')) return
    emit('update:modelValue', multiple.value ? storageIds : (storageIds[0] ?? ''))
  }

  function normalizeUploadValue(value: unknown): ProUploadFileItem[] {
    const values = Array.isArray(value) ? value : [value]
    return values
      .map((item, index) => uploadValueToItem(item, index))
      .filter((item): item is ProUploadFileItem => item != null)
  }

  function hasActiveUpload(list: ProUploadFileItem[]): boolean {
    return list.some((item) => ['pending', 'queued', 'uploading'].includes(item.status))
  }

  // Schema 驱动的 storage_id 字段是合同认可的保留通道：
  // 策略字段来自字段 schema（field.storage / field.businessType），不是页面 props。
  function schemaUploadRequest(options: ProUploadRequestOptions): void {
    const { formData } = options
    if (props.field.storage) formData.append('storage', props.field.storage)
    if (props.field.businessId) formData.append('business_id', props.field.businessId)
    if (props.field.businessType) formData.append('business_type', props.field.businessType)
    if (props.field.mediaClass) formData.append('media_class', props.field.mediaClass)
    if (props.field.customRequest) {
      props.field.customRequest(options)
      return
    }
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
