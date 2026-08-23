import type { ImageCropOptions, ImageCropOutputType } from './types'

const extensionByType: Record<ImageCropOutputType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function resolveOutputType(file: File, options?: ImageCropOptions): ImageCropOutputType {
  if (options?.outputType) return options.outputType
  if (file.type === 'image/png' || file.type === 'image/webp') return file.type
  return 'image/jpeg'
}

export function normalizeCropFileName(fileName: string, outputType: ImageCropOutputType): string {
  const dotIndex = fileName.lastIndexOf('.')
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName
  return `${base}.${extensionByType[outputType]}`
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputType: ImageCropOutputType,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export returned empty blob'))
          return
        }
        resolve(blob)
      },
      outputType,
      quality,
    )
  })
}

export async function canvasToFile(
  canvas: HTMLCanvasElement,
  sourceFile: File,
  options?: ImageCropOptions,
): Promise<File> {
  const outputType = resolveOutputType(sourceFile, options)
  const blob = await canvasToBlob(canvas, outputType, options?.outputQuality)
  const name = normalizeCropFileName(sourceFile.name, outputType)
  return new File([blob], name, {
    type: outputType,
    lastModified: Date.now(),
  })
}

export function validateImageDimensions(
  image: HTMLImageElement,
  options?: ImageCropOptions,
): boolean {
  const minWidth = options?.minWidth
  const minHeight = options?.minHeight

  if (minWidth !== undefined && image.naturalWidth < minWidth) return false
  if (minHeight !== undefined && image.naturalHeight < minHeight) return false
  return true
}
