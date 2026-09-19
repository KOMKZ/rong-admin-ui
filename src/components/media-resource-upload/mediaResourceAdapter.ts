import type { ProUploadFileItem } from '../pro-upload/types'
import type { MediaResource, MediaResourceClass } from './types'

export function mediaResourceToUploadFile(resource: MediaResource): ProUploadFileItem {
  return {
    uid: resource.storageId,
    name: resource.filename,
    size: resource.size,
    type: resource.contentType,
    status: 'success',
    progress: 100,
    storageId: resource.storageId,
    url: resource.url,
    posterUrl: resource.thumbnail?.url,
    mediaInfo: {
      media_class: resource.mediaClass,
      content_type: resource.contentType,
      width: resource.width,
      height: resource.height,
      duration_ms: resource.durationMs,
      size_bytes: resource.size,
    },
  }
}

/** 上传结果必须同时具备稳定 storage ID 和 URL；缺任一项即视为合同错误。 */
export function uploadFileToMediaResource(
  file: ProUploadFileItem,
  expectedClass: MediaResourceClass,
  response?: unknown,
): MediaResource {
  const raw = responseData(response ?? file.responseData)
  const storageId = (file.storageId ?? String(raw?.storage_id ?? '')).trim()
  const url = (file.url ?? file.thumbUrl ?? String(raw?.url ?? '')).trim()
  if (!storageId || !url) {
    throw new Error('Upload response must include storage_id and url')
  }
  const actualClass = String(file.mediaInfo?.media_class ?? expectedClass)
  if (actualClass !== expectedClass) {
    throw new Error(`Upload response media_class must be ${expectedClass}`)
  }
  const resource: MediaResource = {
    storageId,
    url,
    mediaClass: expectedClass,
    contentType: String(file.mediaInfo?.content_type ?? raw?.content_type ?? file.type ?? ''),
    filename: String(raw?.filename ?? raw?.name ?? file.name),
    size: Number(file.mediaInfo?.size_bytes ?? raw?.size ?? file.size ?? 0),
    width: optionalNumber(file.mediaInfo?.width),
    height: optionalNumber(file.mediaInfo?.height),
    durationMs: optionalNumber(file.mediaInfo?.duration_ms),
  }
  const thumbnail = toThumbnailResource(raw?.thumbnail)
  if (thumbnail) resource.thumbnail = thumbnail
  return resource
}

function responseData(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  const root = value as Record<string, unknown>
  if (root.data && typeof root.data === 'object') return root.data as Record<string, unknown>
  return root
}

function toThumbnailResource(value: unknown): MediaResource | null {
  if (!value || typeof value !== 'object') return null
  const thumbnail = value as Record<string, unknown>
  const storageId = String(thumbnail.storage_id ?? '').trim()
  const url = String(thumbnail.url ?? '').trim()
  if (!storageId || !url) return null
  return {
    storageId,
    url,
    mediaClass: 'image',
    contentType: String(thumbnail.content_type ?? 'image/jpeg'),
    filename: String(thumbnail.filename ?? 'thumbnail.jpg'),
    size: Number(thumbnail.size ?? 0),
    width: optionalNumber(thumbnail.width),
    height: optionalNumber(thumbnail.height),
    durationMs: optionalNumber(thumbnail.duration_ms),
  }
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}
