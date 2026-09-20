import type { ComputedRef, Ref } from 'vue'
import type {
  ProUploadFileItem,
  ProUploadProps,
  ProUploadRequestOptions,
  ProUploadRetryConfig,
} from './types'
import { buildFormData, defaultUploadRequest, parseServerResponse } from './uploadCoreHelpers'

interface UploadQueueRuntime {
  activeUploads: number
  processingUids: Set<string>
}

interface UploadQueueOptions {
  abortControllers: Map<string, AbortController>
  emit: {
    success: (file: ProUploadFileItem, response: unknown) => void
    error: (file: ProUploadFileItem, err: Error) => void
  }
  fileList: Ref<ProUploadFileItem[]>
  props: ProUploadProps
  retryConfig: ComputedRef<Required<ProUploadRetryConfig>>
  concurrency: ComputedRef<number>
  updateFile: (uid: string, patch: Partial<ProUploadFileItem>) => void
}

export function createUploadQueue(options: UploadQueueOptions) {
  const runtime: UploadQueueRuntime = { activeUploads: 0, processingUids: new Set() }
  const processQueue = () => processUploadQueue(options, runtime, processQueue)
  const executeUpload = (item: ProUploadFileItem) =>
    executeQueuedUpload(options, runtime, processQueue, item)
  return {
    abortActiveFile: (uid: string) => abortActiveFile(options, runtime, uid),
    clearQueue: () => clearQueue(options, runtime),
    executeUpload,
    processQueue,
  }
}

function processUploadQueue(
  options: UploadQueueOptions,
  runtime: UploadQueueRuntime,
  processQueue: () => void,
) {
  const queued = options.fileList.value.filter(
    (f) => f.status === 'queued' && !runtime.processingUids.has(f.uid),
  )
  for (const next of queued) {
    if (runtime.activeUploads >= options.concurrency.value) break
    runtime.processingUids.add(next.uid)
    executeQueuedUpload(options, runtime, processQueue, next)
  }
}

function executeQueuedUpload(
  options: UploadQueueOptions,
  runtime: UploadQueueRuntime,
  processQueue: () => void,
  item: ProUploadFileItem,
) {
  if (!item.raw) {
    runtime.processingUids.delete(item.uid)
    return
  }
  runtime.activeUploads++
  options.updateFile(item.uid, { status: 'uploading', progress: 0 })
  const requestOptions = buildRequestOptions(options, runtime, processQueue, item)
  if (options.props.customRequest) {
    options.props.customRequest(requestOptions)
  } else {
    defaultUploadRequest(options.props, requestOptions)
  }
}

function buildRequestOptions(
  options: UploadQueueOptions,
  runtime: UploadQueueRuntime,
  processQueue: () => void,
  item: ProUploadFileItem,
): ProUploadRequestOptions {
  const controller = new AbortController()
  options.abortControllers.set(item.uid, controller)
  return {
    file: item.raw!,
    formData: buildFormData(item.raw!),
    signal: controller.signal,
    onProgress: (percent) => options.updateFile(item.uid, { progress: Math.min(percent, 99) }),
    onSuccess: (response) => handleUploadSuccess(options, runtime, processQueue, item, response),
    onError: (error) => handleUploadError(options, runtime, processQueue, item, error),
  }
}

function handleUploadSuccess(
  options: UploadQueueOptions,
  runtime: UploadQueueRuntime,
  processQueue: () => void,
  item: ProUploadFileItem,
  response: unknown,
) {
  finishUpload(options, runtime, item.uid)
  options.updateFile(item.uid, {
    status: 'success',
    progress: 100,
    ...parseServerResponse(options.props, response),
  })
  const updated = options.fileList.value.find((f) => f.uid === item.uid)
  if (updated) options.emit.success(updated, response)
  processQueue()
}

function handleUploadError(
  options: UploadQueueOptions,
  runtime: UploadQueueRuntime,
  processQueue: () => void,
  item: ProUploadFileItem,
  error: Error,
) {
  finishUpload(options, runtime, item.uid)
  const current = options.fileList.value.find((f) => f.uid === item.uid)
  if (!current) return
  const retries = current._retryCount ?? 0
  if (retries < options.retryConfig.value.maxRetries) {
    options.updateFile(item.uid, { _retryCount: retries + 1, status: 'queued' })
    setTimeout(() => processQueue(), options.retryConfig.value.retryDelay)
  } else {
    options.updateFile(item.uid, { status: 'error', error: error.message })
    options.emit.error({ ...current, status: 'error', error: error.message }, error)
  }
  processQueue()
}

function abortActiveFile(options: UploadQueueOptions, runtime: UploadQueueRuntime, uid: string) {
  const controller = options.abortControllers.get(uid)
  if (!controller) return
  controller.abort()
  options.abortControllers.delete(uid)
  runtime.processingUids.delete(uid)
  runtime.activeUploads = Math.max(0, runtime.activeUploads - 1)
}

function clearQueue(options: UploadQueueOptions, runtime: UploadQueueRuntime) {
  for (const [, controller] of options.abortControllers) controller.abort()
  options.abortControllers.clear()
  runtime.processingUids.clear()
  runtime.activeUploads = 0
}

function finishUpload(options: UploadQueueOptions, runtime: UploadQueueRuntime, uid: string) {
  runtime.activeUploads--
  runtime.processingUids.delete(uid)
  options.abortControllers.delete(uid)
}
