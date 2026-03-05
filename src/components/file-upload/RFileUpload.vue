<script lang="ts" setup>
import { computed, ref, type PropType } from 'vue'
import { NUpload, NUploadDragger, NButton, NText } from 'naive-ui'
import type {
  UploadFile,
  UploadListType,
  UploadRequestOptions,
  UploadQueueConfig,
  ChunkedUploadStrategy,
  FileUploadExpose,
} from './types'

const props = defineProps({
  fileList: { type: Array as PropType<UploadFile[]>, required: true },
  action: { type: String, default: undefined },
  accept: { type: String, default: undefined },
  maxCount: { type: Number, default: undefined },
  maxSize: { type: Number, default: undefined },
  multiple: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  listType: { type: String as PropType<UploadListType>, default: 'text' },
  draggable: { type: Boolean, default: false },
  customRequest: {
    type: Function as PropType<(options: UploadRequestOptions) => void>,
    default: undefined,
  },
  showRemoveButton: { type: Boolean, default: true },
  showPreviewButton: { type: Boolean, default: true },
  queueConfig: { type: Object as PropType<UploadQueueConfig>, default: undefined },
  chunkedStrategy: { type: Object as PropType<ChunkedUploadStrategy>, default: undefined },
})

const emit = defineEmits<{
  'update:fileList': [fileList: UploadFile[]]
  beforeUpload: [file: File, done: (proceed: boolean) => void]
  change: [info: { file: UploadFile; fileList: UploadFile[] }]
  remove: [file: UploadFile]
  preview: [file: UploadFile]
  retryExhausted: [file: UploadFile]
}>()

const uploadRef = ref<InstanceType<typeof NUpload> | null>(null)
const abortControllers = new Map<string, AbortController>()
const retryCountMap = new Map<string, number>()
const uploadQueue: Array<{ fileId: string; rawFile: File }> = []
let activeUploads = 0

const concurrency = computed(() => props.queueConfig?.concurrency ?? 3)
const maxRetries = computed(() => props.queueConfig?.maxRetries ?? 2)
const retryDelay = computed(() => props.queueConfig?.retryDelay ?? 1000)

const naiveFileList = computed(() =>
  props.fileList.map((f) => ({
    id: f.id,
    name: f.name,
    status: mapStatus(f.status),
    url: f.url,
    thumbnailUrl: f.thumbUrl,
    percentage: f.percent,
    type: f.type,
  })),
)

function mapStatus(s: UploadFile['status']): 'pending' | 'uploading' | 'finished' | 'error' {
  if (s === 'success') return 'finished'
  if (s === 'paused') return 'pending'
  return s as 'pending' | 'uploading' | 'error'
}

function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function handleBeforeUpload(data: { file: { file: File | null } }): Promise<boolean> {
  return new Promise((resolve) => {
    if (!data.file.file) {
      resolve(false)
      return
    }
    const file = data.file.file

    if (props.maxSize && file.size > props.maxSize) {
      resolve(false)
      return
    }

    if (props.maxCount && props.fileList.length >= props.maxCount) {
      resolve(false)
      return
    }

    emit('beforeUpload', file, (proceed) => resolve(proceed))
  })
}

function processQueue(): void {
  while (activeUploads < concurrency.value && uploadQueue.length > 0) {
    const item = uploadQueue.shift()!
    activeUploads++
    executeUpload(item.fileId, item.rawFile).finally(() => {
      activeUploads--
      processQueue()
    })
  }
}

async function executeUpload(fileId: string, rawFile: File): Promise<void> {
  const controller = new AbortController()
  abortControllers.set(fileId, controller)

  try {
    if (props.customRequest) {
      await new Promise<void>((resolve, reject) => {
        props.customRequest!({
          file: rawFile,
          signal: controller.signal,
          onProgress: (percent) => {
            updateFileInList(fileId, { percent, status: 'uploading' })
          },
          onSuccess: () => {
            updateFileInList(fileId, { status: 'success', percent: 100 })
            resolve()
          },
          onError: (error) => {
            reject(error)
          },
        })
      })
    }
  } catch (err) {
    const retries = retryCountMap.get(fileId) ?? 0
    if (retries < maxRetries.value) {
      retryCountMap.set(fileId, retries + 1)
      updateFileInList(fileId, { status: 'pending', error: undefined })
      await new Promise((r) => setTimeout(r, retryDelay.value))
      uploadQueue.push({ fileId, rawFile })
    } else {
      const errMsg = err instanceof Error ? err.message : 'Upload failed'
      updateFileInList(fileId, { status: 'error', error: errMsg })
      const file = props.fileList.find((f) => f.id === fileId)
      if (file) emit('retryExhausted', file)
    }
  } finally {
    abortControllers.delete(fileId)
  }
}

function handleCustomRequest(options: {
  file: { file: File | null; name: string; id: string }
  onProgress: (e: { percent: number }) => void
  onFinish: () => void
  onError: () => void
}): void {
  if (!options.file.file) return

  const fileId = options.file.id || generateId()

  const uploadFile: UploadFile = {
    id: fileId,
    name: options.file.name,
    status: 'pending',
    size: options.file.file.size,
    type: options.file.file.type,
    percent: 0,
  }

  const newList = [...props.fileList, uploadFile]
  emit('update:fileList', newList)
  emit('change', { file: uploadFile, fileList: newList })

  if (props.queueConfig) {
    uploadQueue.push({ fileId, rawFile: options.file.file })
    processQueue()
  } else if (props.customRequest) {
    const controller = new AbortController()
    abortControllers.set(fileId, controller)

    props.customRequest({
      file: options.file.file,
      signal: controller.signal,
      onProgress: (percent) => {
        options.onProgress({ percent })
        updateFileInList(fileId, { percent, status: 'uploading' })
      },
      onSuccess: () => {
        options.onFinish()
        updateFileInList(fileId, { status: 'success' })
      },
      onError: (error) => {
        options.onError()
        updateFileInList(fileId, { status: 'error', error: error.message })
      },
    })
  }
}

function updateFileInList(fileId: string, patch: Partial<UploadFile>): void {
  const updated = props.fileList.map((f) => (f.id === fileId ? { ...f, ...patch } : f))
  emit('update:fileList', updated)
  const file = updated.find((f) => f.id === fileId)
  if (file) {
    emit('change', { file, fileList: updated })
  }
}

function handleRemove(data: { file: { id: string } }): boolean {
  const target = props.fileList.find((f) => f.id === data.file.id)
  if (!target) return true

  const newList = props.fileList.filter((f) => f.id !== data.file.id)
  emit('update:fileList', newList)
  emit('change', {
    file: { ...target, status: 'removed' as UploadFile['status'] },
    fileList: newList,
  })
  emit('remove', target)

  const controller = abortControllers.get(target.id)
  if (controller) {
    controller.abort()
    abortControllers.delete(target.id)
  }

  return false
}

function handlePreview(fileId: string): void {
  const target = props.fileList.find((f) => f.id === fileId)
  if (target) emit('preview', target)
}

function onNaivePreview(file: { id?: string; file?: File | null }): void {
  const id = file.id ?? file.file?.name ?? ''
  handlePreview(id)
}

const expose: FileUploadExpose = {
  submit: () => uploadRef.value?.submit(),
  clear: () => emit('update:fileList', []),
  abort: (fileId: string) => {
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
      updateFileInList(fileId, { status: 'error', error: 'Aborted' })
    }
  },
  pause: (fileId: string) => {
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
      updateFileInList(fileId, { status: 'paused' })
    }
  },
  resume: (fileId: string) => {
    const file = props.fileList.find((f) => f.id === fileId && f.status === 'paused')
    if (!file) return
    updateFileInList(fileId, { status: 'pending' })
  },
  retry: (fileId: string) => {
    const file = props.fileList.find((f) => f.id === fileId && f.status === 'error')
    if (!file) return
    retryCountMap.set(fileId, 0)
    updateFileInList(fileId, { status: 'pending', error: undefined, percent: 0 })
  },
}

defineExpose(expose)
</script>

<template>
  <NUpload
    ref="uploadRef"
    :action="action"
    :accept="accept"
    :max="maxCount"
    :multiple="multiple"
    :disabled="disabled"
    :list-type="listType === 'image' ? 'image-card' : listType"
    :file-list="naiveFileList"
    :custom-request="customRequest != null ? handleCustomRequest : undefined"
    :show-remove-button="showRemoveButton"
    :show-preview-button="showPreviewButton"
    @before-upload="handleBeforeUpload"
    @remove="handleRemove"
    @preview="onNaivePreview"
  >
    <template v-if="draggable">
      <NUploadDragger>
        <slot name="trigger">
          <div style="padding: 24px; text-align: center">
            <NText depth="3">点击或拖拽文件到此区域上传</NText>
          </div>
        </slot>
      </NUploadDragger>
    </template>
    <template v-else>
      <slot name="trigger">
        <NButton>选择文件</NButton>
      </slot>
    </template>

    <slot name="tip" />
    <slot />
  </NUpload>
</template>
