import type { ProUploadFileItem, ProUploadFileStatus } from './types'

let uidSeed = 0

export function generateUid(): string {
  return `pu_${Date.now()}_${++uidSeed}`
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
