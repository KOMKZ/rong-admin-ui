import type { ProUploadFileItem, ProUploadProps } from '../pro-upload/types'

export type ImageCropOutputType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ImageCropOptions {
  /** Fixed crop ratio. Use 1 for square avatar. */
  aspectRatio?: number
  /** Display crop box width in the crop dialog. It is clamped to the available stage. */
  cropBoxWidth?: number
  /** Display crop box height in the crop dialog. It is clamped to the available stage. */
  cropBoxHeight?: number
  /** Output canvas width in pixels. */
  outputWidth?: number
  /** Output canvas height in pixels. */
  outputHeight?: number
  /** Output MIME type. */
  outputType?: ImageCropOutputType
  /** Output quality for lossy formats, from 0 to 1. */
  outputQuality?: number
  /** Minimum source image width. */
  minWidth?: number
  /** Minimum source image height. */
  minHeight?: number
  /** Render preview as circular avatar while keeping rectangular file output. */
  circularPreview?: boolean
}

export interface ImageCropResult {
  file: File
  sourceFile: File
  canvas: HTMLCanvasElement
}

export interface ImageCropLocale {
  title?: string
  confirmText?: string
  cancelText?: string
  resetText?: string
  rotateLeftText?: string
  rotateRightText?: string
  zoomInText?: string
  zoomOutText?: string
  moveUpText?: string
  moveRightText?: string
  moveDownText?: string
  moveLeftText?: string
  invalidImage?: string
  exportFailed?: string
}

export interface ImageCropUploadProps extends ProUploadProps {
  /** Enable crop dialog for image files. */
  crop?: boolean
  /** Crop dialog and output options. */
  cropOptions?: ImageCropOptions
  /** Crop dialog locale overrides. */
  cropLocale?: Partial<ImageCropLocale>
}

export interface ImageCropUploadEmits {
  (e: 'change', fileList: ProUploadFileItem[]): void
  (e: 'update:value', fileList: ProUploadFileItem[]): void
  (e: 'update:modelValue', fileList: ProUploadFileItem[]): void
  (e: 'success', file: ProUploadFileItem, response: unknown): void
  (e: 'error', file: ProUploadFileItem, error: Error): void
  (e: 'preview', file: ProUploadFileItem): void
  (e: 'remove', file: ProUploadFileItem): void
  (
    e: 'exceed',
    info: { type: 'count' | 'size' | 'accept'; file: File; limit: number | string },
  ): void
  (e: 'crop-success', result: ImageCropResult): void
  (e: 'crop-cancel', file: File): void
  (e: 'crop-error', error: Error): void
}

export const defaultImageCropLocale: Required<ImageCropLocale> = {
  title: '裁切图片',
  confirmText: '应用裁切',
  cancelText: '取消',
  resetText: '重置',
  rotateLeftText: '左旋转',
  rotateRightText: '右旋转',
  zoomInText: '放大',
  zoomOutText: '缩小',
  moveUpText: '上移图片',
  moveRightText: '右移图片',
  moveDownText: '下移图片',
  moveLeftText: '左移图片',
  invalidImage: '图片不符合裁切要求',
  exportFailed: '图片裁切失败',
}
