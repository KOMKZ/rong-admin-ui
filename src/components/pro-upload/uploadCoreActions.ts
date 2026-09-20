import type { Ref } from 'vue'
import type { ProUploadFileItem, ProUploadProps } from './types'
import { createFileItem, revokeThumbUrls } from './uploadCoreFileItem'
import { validateUploadFile, validateUploadFileContent } from './uploadCoreHelpers'

interface UploadActionsOptions {
  emit: {
    exceed: (info: {
      type: 'count' | 'size' | 'accept'
      file: File
      limit: number | string
    }) => void
    remove: (file: ProUploadFileItem) => void
  }
  fileList: Ref<ProUploadFileItem[]>
  props: ProUploadProps
  queue: {
    abortActiveFile: (uid: string) => void
    clearQueue: () => void
    processQueue: () => void
  }
  syncList: (list: ProUploadFileItem[]) => void
  updateFile: (uid: string, patch: Partial<ProUploadFileItem>) => void
}

export function createUploadActions(options: UploadActionsOptions) {
  return {
    abortFile: (uid: string) => options.queue.abortActiveFile(uid),
    addFiles: (files: File[]) => addFiles(options, files),
    clear: () => clearFiles(options),
    removeFile: (uid: string) => removeFile(options, uid),
    retryFile: (uid: string) => retryFile(options, uid),
    submit: () => submitPending(options),
  }
}

async function addFiles(options: UploadActionsOptions, files: File[]) {
  const toAdd: ProUploadFileItem[] = []
  const isSingleReplace = !options.props.multiple && options.props.maxCount === 1
  for (const file of files) {
    const item = await prepareUploadItem(options, file, isSingleReplace)
    if (item) toAdd.push(item)
  }
  if (toAdd.length === 0) return
  options.syncList(buildNextFileList(options, toAdd))
  options.queue.processQueue()
}

async function prepareUploadItem(
  options: UploadActionsOptions,
  file: File,
  isSingleReplace: boolean,
): Promise<ProUploadFileItem | null> {
  const currentCount = options.fileList.value.filter((f) => f.status !== 'error').length
  const validation = validateUploadFile(options.props, file, currentCount, isSingleReplace)
  if (!validation.valid) {
    options.emit.exceed({ type: validation.type!, file, limit: validation.limit! })
    return null
  }
  const uploadFile = await runBeforeUploadAndTransform(options, file)
  if (!uploadFile) return null
  const transformed = validateUploadFileContent(options.props, uploadFile)
  if (!transformed.valid) {
    options.emit.exceed({ type: transformed.type!, file: uploadFile, limit: transformed.limit! })
    return null
  }
  return createFileItem(uploadFile, 'queued')
}

async function runBeforeUploadAndTransform(
  options: UploadActionsOptions,
  file: File,
): Promise<File | null> {
  if (options.props.beforeUpload) {
    try {
      if ((await options.props.beforeUpload(file)) === false) return null
    } catch {
      return null
    }
  }
  if (!options.props.transformFile) return file
  try {
    return await options.props.transformFile(file)
  } catch {
    return null
  }
}

function buildNextFileList(
  options: UploadActionsOptions,
  toAdd: ProUploadFileItem[],
): ProUploadFileItem[] {
  if (!options.props.multiple && options.props.maxCount === 1) {
    for (const old of options.fileList.value) options.queue.abortActiveFile(old.uid)
    revokeThumbUrls(options.fileList.value)
    return toAdd.slice(0, 1)
  }
  return [...options.fileList.value, ...toAdd]
}

function removeFile(options: UploadActionsOptions, uid: string) {
  const file = options.fileList.value.find((f) => f.uid === uid)
  if (!file) return
  options.queue.abortActiveFile(uid)
  if (file.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(file.thumbUrl)
  options.syncList(options.fileList.value.filter((f) => f.uid !== uid))
  options.emit.remove(file)
  options.queue.processQueue()
}

function retryFile(options: UploadActionsOptions, uid: string) {
  const file = options.fileList.value.find((f) => f.uid === uid)
  if (!file?.raw || file.status !== 'error') return
  options.updateFile(uid, { status: 'queued', error: undefined, progress: 0, _retryCount: 0 })
  options.queue.processQueue()
}

function clearFiles(options: UploadActionsOptions) {
  revokeThumbUrls(options.fileList.value)
  options.queue.clearQueue()
  options.syncList([])
}

function submitPending(options: UploadActionsOptions) {
  const pending = options.fileList.value.filter((f) => f.status === 'pending')
  if (pending.length === 0) return
  options.syncList(
    options.fileList.value.map((f) =>
      f.status === 'pending' ? { ...f, status: 'queued' as const } : f,
    ),
  )
  options.queue.processQueue()
}
