import type {
  ProUploadFileItem,
  ProUploadPayloadContext,
  ProUploadProps,
  ProUploadRequestOptions,
} from './types'

export interface UploadValidationResult {
  valid: boolean
  type?: 'count' | 'size' | 'accept'
  limit?: number | string
}

export function getPayloadContext(props: ProUploadProps): ProUploadPayloadContext {
  return {
    storage: props.storage,
    category: props.category,
    businessId: props.businessId,
    businessType: props.businessType,
  }
}

export function buildFormData(props: ProUploadProps, file: File): FormData {
  if (props.buildUploadPayload) {
    return props.buildUploadPayload(file, getPayloadContext(props))
  }
  const fd = new FormData()
  fd.append('file', file)
  if (props.storage) fd.append('storage', props.storage)
  if (props.businessId) fd.append('business_id', props.businessId)
  if (props.businessType) fd.append('business_type', props.businessType)
  return fd
}

export function parseServerResponse(
  props: ProUploadProps,
  raw: unknown,
): Partial<ProUploadFileItem> {
  if (props.parseResponse) return props.parseResponse(raw)
  if (!raw || typeof raw !== 'object') return {}
  const r = raw as Record<string, unknown>
  const data = (typeof r.data === 'object' && r.data !== null ? r.data : r) as Record<
    string,
    unknown
  >
  return {
    fileId: (data.id ?? data.ID ?? data.file_id) as number | undefined,
    storageId: (data.storage_id ?? data.StorageID ?? data.storageId) as string | undefined,
    url: (data.url ?? data.URL) as string | undefined,
    name: (data.original_name ?? data.original_filename ?? data.OriginalFilename) as
      | string
      | undefined,
    mediaInfo: (data.media_info ?? data.mediaInfo) as ProUploadFileItem['mediaInfo'],
    responseData: data,
  }
}

export function defaultUploadRequest(
  props: ProUploadProps,
  options: ProUploadRequestOptions,
) {
  const xhr = new XMLHttpRequest()
  xhr.open(props.method ?? 'POST', props.action ?? '/api/files/upload')
  xhr.withCredentials = props.withCredentials ?? false
  for (const [key, value] of Object.entries(props.headers ?? {})) {
    xhr.setRequestHeader(key, value)
  }
  bindXHRUploadEvents(xhr, options)
  options.signal.addEventListener('abort', () => xhr.abort())
  xhr.send(options.formData)
}

export function validateUploadFile(
  props: ProUploadProps,
  file: File,
  currentCount: number,
  isReplacement: boolean,
): UploadValidationResult {
  if (!isReplacement && props.maxCount !== undefined && currentCount >= props.maxCount) {
    return { valid: false, type: 'count', limit: props.maxCount }
  }
  return validateUploadFileContent(props, file)
}

export function validateUploadFileContent(
  props: ProUploadProps,
  file: File,
): UploadValidationResult {
  if (props.maxSizeMB !== undefined && file.size > props.maxSizeMB * 1024 * 1024) {
    return { valid: false, type: 'size', limit: props.maxSizeMB }
  }
  if (!props.accept || matchesAccept(file, props.accept)) return { valid: true }
  return { valid: false, type: 'accept', limit: props.accept }
}

function bindXHRUploadEvents(
  xhr: XMLHttpRequest,
  options: ProUploadRequestOptions,
) {
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) options.onProgress(Math.round((e.loaded / e.total) * 100))
  })
  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      options.onSuccess(parseXHRResponse(xhr.responseText))
      return
    }
    options.onError(new Error(parseUploadErrorMessage(xhr)))
  })
  xhr.addEventListener('error', () => options.onError(new Error('Network error')))
  xhr.addEventListener('abort', () => options.onError(new Error('Upload aborted')))
}

function parseXHRResponse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function parseUploadErrorMessage(xhr: XMLHttpRequest): string {
  const fallback = `Upload failed: ${xhr.status} ${xhr.statusText}`.trim()
  const text = xhr.responseText?.trim()
  if (!text) return fallback
  try {
    const message = extractMessage(JSON.parse(text) as unknown)
    return message || fallback
  } catch {
    return text
  }
}

function extractMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const record = payload as Record<string, unknown>
  for (const key of ['msg', 'message', 'error', 'error_msg']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return extractMessage(record.data)
}

function matchesAccept(file: File, accept: string): boolean {
  const ext = getExtension(file.name)
  const accepts = accept.split(',').map((s) => s.trim().toLowerCase())
  return accepts.some((item) => {
    if (item.startsWith('.')) return ext === item
    if (item.endsWith('/*')) return file.type.startsWith(item.replace('/*', '/'))
    return file.type === item
  })
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot).toLowerCase() : ''
}
