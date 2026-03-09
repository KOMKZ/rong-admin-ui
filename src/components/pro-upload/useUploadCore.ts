import { ref, computed, watch, type Ref } from 'vue'
import type {
  ProUploadFileItem,
  ProUploadFileStatus,
  ProUploadRequestOptions,
  ProUploadRetryConfig,
  ProUploadPayloadContext,
  ProUploadProps,
} from './types'

let _uid = 0
export function generateUid(): string {
  return `pu_${Date.now()}_${++_uid}`
}

export function createFileItem(
  file: File,
  status: ProUploadFileStatus = 'pending',
): ProUploadFileItem {
  return {
    uid: generateUid(),
    name: file.name,
    size: file.size,
    type: file.type,
    status,
    progress: 0,
    raw: file,
    thumbUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    _retryCount: 0,
  }
}

export function revokeThumbUrls(files: ProUploadFileItem[]) {
  for (const f of files) {
    if (f.thumbUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(f.thumbUrl)
    }
  }
}

interface UploadCoreOptions {
  props: ProUploadProps
  emit: {
    change: (list: ProUploadFileItem[]) => void
    updateValue: (list: ProUploadFileItem[]) => void
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
  let activeUploads = 0

  const isControlled = computed(() => props.value !== undefined)

  watch(
    () => props.value,
    (val) => {
      if (val !== undefined) {
        fileList.value = val
      }
    },
    { immediate: true, deep: true },
  )

  function syncList(list: ProUploadFileItem[]) {
    fileList.value = list
    emit.updateValue(list)
    emit.change(list)
  }

  function updateFile(uid: string, patch: Partial<ProUploadFileItem>) {
    const list = [...fileList.value]
    const idx = list.findIndex((f) => f.uid === uid)
    if (idx === -1) return
    list[idx] = { ...list[idx], ...patch }
    syncList(list)
  }

  function getPayloadContext(): ProUploadPayloadContext {
    return {
      storage: props.storage,
      category: props.category,
      businessId: props.businessId,
      businessType: props.businessType,
    }
  }

  function buildFormData(file: File): FormData {
    if (props.buildUploadPayload) {
      return props.buildUploadPayload(file, getPayloadContext())
    }
    const fd = new FormData()
    fd.append('file', file)
    if (props.storage) fd.append('type', props.storage)
    if (props.businessId) fd.append('business_id', props.businessId)
    if (props.businessType) fd.append('business_type', props.businessType)
    return fd
  }

  function parseServerResponse(raw: unknown): Partial<ProUploadFileItem> {
    if (props.parseResponse) return props.parseResponse(raw)
    if (!raw || typeof raw !== 'object') return {}
    const r = raw as Record<string, unknown>
    const data = (typeof r.data === 'object' && r.data !== null ? r.data : r) as Record<
      string,
      unknown
    >
    return {
      fileId: (data.id ?? data.file_id) as number | undefined,
      storageId: (data.storage_id ?? data.storageId) as string | undefined,
      url: data.url as string | undefined,
      name: (data.original_name ?? data.original_filename) as string | undefined,
    }
  }

  const retryConfig = computed<Required<ProUploadRetryConfig>>(() => ({
    maxRetries: props.retryConfig?.maxRetries ?? 2,
    retryDelay: props.retryConfig?.retryDelay ?? 1000,
  }))

  const concurrency = computed(() => props.concurrency ?? 3)

  const _processingUids = new Set<string>()

  function processQueue() {
    const queued = fileList.value.filter(
      (f) => f.status === 'queued' && !_processingUids.has(f.uid),
    )
    for (const next of queued) {
      if (activeUploads >= concurrency.value) break
      _processingUids.add(next.uid)
      executeUpload(next)
    }
  }

  function executeUpload(item: ProUploadFileItem) {
    if (!item.raw) {
      _processingUids.delete(item.uid)
      return
    }
    activeUploads++
    updateFile(item.uid, { status: 'uploading', progress: 0 })

    const controller = new AbortController()
    abortControllers.set(item.uid, controller)

    const file = item.raw
    const formData = buildFormData(file)

    const requestOptions: ProUploadRequestOptions = {
      file,
      formData,
      signal: controller.signal,
      onProgress(percent: number) {
        updateFile(item.uid, { progress: Math.min(percent, 99) })
      },
      onSuccess(response: unknown) {
        activeUploads--
        _processingUids.delete(item.uid)
        abortControllers.delete(item.uid)
        const parsed = parseServerResponse(response)
        updateFile(item.uid, {
          status: 'success',
          progress: 100,
          ...parsed,
        })
        const updated = fileList.value.find((f) => f.uid === item.uid)
        if (updated) emit.success(updated, response)
        processQueue()
      },
      onError(error: Error) {
        activeUploads--
        _processingUids.delete(item.uid)
        abortControllers.delete(item.uid)
        const current = fileList.value.find((f) => f.uid === item.uid)
        if (!current) return

        const retries = current._retryCount ?? 0
        if (retries < retryConfig.value.maxRetries) {
          updateFile(item.uid, { _retryCount: retries + 1, status: 'queued' })
          setTimeout(() => processQueue(), retryConfig.value.retryDelay)
        } else {
          updateFile(item.uid, { status: 'error', error: error.message })
          emit.error({ ...current, status: 'error', error: error.message }, error)
        }
        processQueue()
      },
    }

    if (props.customRequest) {
      props.customRequest(requestOptions)
    } else {
      defaultUploadRequest(requestOptions)
    }
  }

  function defaultUploadRequest(options: ProUploadRequestOptions) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/files/upload')

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        options.onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          options.onSuccess(JSON.parse(xhr.responseText))
        } catch {
          options.onSuccess(xhr.responseText)
        }
      } else {
        options.onError(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      options.onError(new Error('Network error'))
    })

    xhr.addEventListener('abort', () => {
      options.onError(new Error('Upload aborted'))
    })

    options.signal.addEventListener('abort', () => xhr.abort())

    xhr.send(options.formData)
  }

  /* ─── Validation ─── */

  function getExtension(filename: string): string {
    const dot = filename.lastIndexOf('.')
    return dot >= 0 ? filename.slice(dot).toLowerCase() : ''
  }

  function validateFile(
    file: File,
    isReplacement: boolean,
  ): { valid: boolean; type?: 'count' | 'size' | 'accept'; limit?: number | string } {
    if (!isReplacement && props.maxCount !== undefined) {
      const currentCount = fileList.value.filter((f) => f.status !== 'error').length
      if (currentCount >= props.maxCount) {
        return { valid: false, type: 'count', limit: props.maxCount }
      }
    }

    if (props.maxSizeMB !== undefined) {
      const maxBytes = props.maxSizeMB * 1024 * 1024
      if (file.size > maxBytes) {
        return { valid: false, type: 'size', limit: props.maxSizeMB }
      }
    }

    if (props.accept) {
      const ext = getExtension(file.name)
      const accepts = props.accept.split(',').map((s) => s.trim().toLowerCase())
      const matchesExt = accepts.some((a) => a.startsWith('.') && ext === a)
      const matchesMime = accepts.some((a) => {
        if (a.endsWith('/*')) {
          return file.type.startsWith(a.replace('/*', '/'))
        }
        return file.type === a
      })
      if (!matchesExt && !matchesMime) {
        return { valid: false, type: 'accept', limit: props.accept }
      }
    }

    return { valid: true }
  }

  /* ─── Public API ─── */

  async function addFiles(files: File[]) {
    const toAdd: ProUploadFileItem[] = []
    const isSingleReplace = !props.multiple && props.maxCount === 1

    for (const file of files) {
      const validation = validateFile(file, isSingleReplace)
      if (!validation.valid) {
        emit.exceed({ type: validation.type!, file, limit: validation.limit! })
        continue
      }

      if (props.beforeUpload) {
        try {
          const proceed = await props.beforeUpload(file)
          if (proceed === false) continue
        } catch {
          continue
        }
      }

      toAdd.push(createFileItem(file, 'queued'))
    }

    if (toAdd.length === 0) return

    let newList: ProUploadFileItem[]
    if (!props.multiple && props.maxCount === 1) {
      for (const old of fileList.value) {
        const ctrl = abortControllers.get(old.uid)
        if (ctrl) {
          ctrl.abort()
          abortControllers.delete(old.uid)
          _processingUids.delete(old.uid)
          activeUploads = Math.max(0, activeUploads - 1)
        }
      }
      revokeThumbUrls(fileList.value)
      newList = toAdd.slice(0, 1)
    } else {
      newList = [...fileList.value, ...toAdd]
    }

    syncList(newList)
    processQueue()
  }

  function removeFile(uid: string) {
    const file = fileList.value.find((f) => f.uid === uid)
    if (!file) return

    const controller = abortControllers.get(uid)
    if (controller) {
      controller.abort()
      abortControllers.delete(uid)
      activeUploads = Math.max(0, activeUploads - 1)
    }

    if (file.thumbUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(file.thumbUrl)
    }

    const newList = fileList.value.filter((f) => f.uid !== uid)
    syncList(newList)
    emit.remove(file)
    processQueue()
  }

  function retryFile(uid: string) {
    const file = fileList.value.find((f) => f.uid === uid)
    if (!file || !file.raw) return
    if (file.status !== 'error') return
    updateFile(uid, { status: 'queued', error: undefined, progress: 0, _retryCount: 0 })
    processQueue()
  }

  function abortFile(uid: string) {
    const controller = abortControllers.get(uid)
    if (controller) {
      controller.abort()
    }
  }

  function clear() {
    revokeThumbUrls(fileList.value)
    for (const [, controller] of abortControllers) {
      controller.abort()
    }
    abortControllers.clear()
    activeUploads = 0
    syncList([])
  }

  function submit() {
    const pending = fileList.value.filter((f) => f.status === 'pending')
    if (pending.length === 0) return
    const list = fileList.value.map((f) =>
      f.status === 'pending' ? { ...f, status: 'queued' as const } : f,
    )
    syncList(list)
    processQueue()
  }

  return {
    fileList,
    isControlled,
    addFiles,
    removeFile,
    retryFile,
    abortFile,
    clear,
    submit,
    processQueue,
  }
}
