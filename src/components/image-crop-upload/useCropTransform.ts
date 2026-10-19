import { onBeforeUnmount, ref } from 'vue'
import { isImageFile } from './cropper-utils'
import type { ImageCropResult } from './types'

interface UseCropTransformOptions {
  /** 是否启用裁切弹窗；非图片文件始终绕过。 */
  enabled: () => boolean
  /** 裁切之后（或未启用裁切时）追加的外部文件变换，例如调用方注入的 transformFile。 */
  next?: () => ((file: File) => File | Promise<File>) | undefined
  /** 组件卸载时仍有未完成裁切时的 reject 文案。 */
  unmountRejectMessage?: string
  onConfirm?: (result: ImageCropResult) => void
  onCancel?: (file: File) => void
  onError?: (error: Error) => void
}

interface PendingCrop {
  sourceFile: File
  resolve: (file: File | Promise<File>) => void
  reject: (error: Error) => void
}

/**
 * 上传前裁切的通用拦截：包住 RProUpload 的 transformFile 时机，把图片文件
 * 暂停在弹窗确认上，确认后以裁切产物继续上传，取消则让上传 Promise 失败。
 */
export function useCropTransform(options: UseCropTransformOptions) {
  const cropDialogVisible = ref(false)
  const cropSourceFile = ref<File | undefined>(undefined)
  const pendingCrop = ref<PendingCrop | null>(null)

  function applyNextTransform(file: File): File | Promise<File> {
    const next = options.next?.()
    return next ? next(file) : file
  }

  function clearCropState(): void {
    cropDialogVisible.value = false
    cropSourceFile.value = undefined
    pendingCrop.value = null
  }

  function handleTransformFile(file: File): File | Promise<File> {
    if (!options.enabled() || !isImageFile(file)) {
      return applyNextTransform(file)
    }

    return new Promise<File>((resolve, reject) => {
      pendingCrop.value = {
        sourceFile: file,
        resolve,
        reject,
      }
      cropSourceFile.value = file
      cropDialogVisible.value = true
    })
  }

  function handleCropConfirm(result: ImageCropResult): void {
    const pending = pendingCrop.value
    if (!pending) return

    options.onConfirm?.(result)
    pending.resolve(applyNextTransform(result.file))
    clearCropState()
  }

  function handleCropCancel(): void {
    const pending = pendingCrop.value
    if (!pending) return

    options.onCancel?.(pending.sourceFile)
    pending.reject(new Error('Image crop cancelled'))
    clearCropState()
  }

  function handleCropError(error: Error): void {
    options.onError?.(error)
  }

  onBeforeUnmount(() => {
    if (pendingCrop.value) {
      pendingCrop.value.reject(
        new Error(options.unmountRejectMessage ?? 'Image crop cancelled'),
      )
    }
    clearCropState()
  })

  return {
    cropDialogVisible,
    cropSourceFile,
    handleTransformFile,
    handleCropConfirm,
    handleCropCancel,
    handleCropError,
  }
}
