import type { ProUploadFileItem } from './types'

export type ProUploadPreviewKind = 'image' | 'video'

export function resolveProUploadPreviewKind(file: ProUploadFileItem): ProUploadPreviewKind | null {
  const mediaClass = String(file.mediaInfo?.media_class ?? '').toLowerCase()
  if (mediaClass === 'image' || mediaClass === 'video') return mediaClass

  const contentType = String(file.mediaInfo?.content_type ?? file.type).toLowerCase()
  if (contentType.startsWith('image/')) return 'image'
  if (contentType.startsWith('video/')) return 'video'
  return null
}

export function resolveProUploadPreviewUrl(file: ProUploadFileItem): string {
  return (file.url ?? file.thumbUrl ?? '').trim()
}

export function canPreviewProUploadFile(file: ProUploadFileItem): boolean {
  return Boolean(resolveProUploadPreviewKind(file) && resolveProUploadPreviewUrl(file))
}

export function formatProUploadFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
