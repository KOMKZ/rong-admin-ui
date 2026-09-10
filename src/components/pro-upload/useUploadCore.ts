import { ref, computed, watch, type Ref } from 'vue'
import type {
  ProUploadFileItem,
  ProUploadRetryConfig,
  ProUploadProps,
} from './types'
import { createUploadActions } from './uploadCoreActions'
import { createUploadQueue } from './uploadCoreQueue'
export { createFileItem, generateUid, revokeThumbUrls } from './uploadCoreFileItem'

interface UploadCoreOptions {
  props: ProUploadProps
  emit: {
    change: (list: ProUploadFileItem[]) => void
    updateValue: (list: ProUploadFileItem[]) => void
    updateModelValue: (list: ProUploadFileItem[]) => void
    success: (file: ProUploadFileItem, response: unknown) => void
    error: (file: ProUploadFileItem, err: Error) => void
    exceed: (info: {
      type: 'count' | 'size' | 'accept'
      file: File
      limit: number | string
    }) => void
    remove: (file: ProUploadFileItem) => void
  }
}

export function useUploadCore(options: UploadCoreOptions) {
  const { props, emit } = options
  const fileList: Ref<ProUploadFileItem[]> = ref([])
  const abortControllers = new Map<string, AbortController>()
  const isControlled = computed(() => props.modelValue !== undefined || props.value !== undefined)
  const retryConfig = computed<Required<ProUploadRetryConfig>>(() => ({
    maxRetries: props.retryConfig?.maxRetries ?? 2,
    retryDelay: props.retryConfig?.retryDelay ?? 1000,
  }))
  const concurrency = computed(() => props.concurrency ?? 3)

  watch(
    () => props.modelValue ?? props.value,
    (val) => {
      if (val !== undefined) {
        fileList.value = val
      }
    },
    { immediate: true, deep: true },
  )

  const syncList = (list: ProUploadFileItem[]) => {
    fileList.value = list
    emit.updateValue(list)
    emit.updateModelValue(list)
    emit.change(list)
  }

  const updateFile = (uid: string, patch: Partial<ProUploadFileItem>) => {
    const list = [...fileList.value]
    const idx = list.findIndex((f) => f.uid === uid)
    if (idx === -1) return
    list[idx] = { ...list[idx], ...patch }
    syncList(list)
  }

  const queue = createUploadQueue({
    abortControllers,
    concurrency,
    emit,
    fileList,
    props,
    retryConfig,
    updateFile,
  })
  const actions = createUploadActions({ emit, fileList, props, queue, syncList, updateFile })

  return {
    fileList,
    isControlled,
    ...actions,
    processQueue: queue.processQueue,
  }
}
