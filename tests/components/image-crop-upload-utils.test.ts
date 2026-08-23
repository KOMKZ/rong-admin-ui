import { describe, expect, it, vi } from 'vitest'
import {
  canvasToFile,
  isImageFile,
  normalizeCropFileName,
  resolveOutputType,
  validateImageDimensions,
} from '@/components/image-crop-upload'

function createFile(name: string, type: string): File {
  return new File(['source'], name, { type })
}

describe('image crop upload utils', () => {
  it('detects image files by MIME type', () => {
    expect(isImageFile(createFile('avatar.jpg', 'image/jpeg'))).toBe(true)
    expect(isImageFile(createFile('doc.pdf', 'application/pdf'))).toBe(false)
  })

  it('resolves output type from options and source file', () => {
    expect(resolveOutputType(createFile('avatar.png', 'image/png'))).toBe('image/png')
    expect(resolveOutputType(createFile('avatar.gif', 'image/gif'))).toBe('image/jpeg')
    expect(
      resolveOutputType(createFile('avatar.png', 'image/png'), { outputType: 'image/webp' }),
    ).toBe('image/webp')
  })

  it('normalizes file extension for output type', () => {
    expect(normalizeCropFileName('avatar.png', 'image/jpeg')).toBe('avatar.jpg')
    expect(normalizeCropFileName('avatar', 'image/webp')).toBe('avatar.webp')
  })

  it('converts canvas to file with requested output options', async () => {
    const sourceFile = createFile('avatar.png', 'image/png')
    const blob = new Blob(['cropped'], { type: 'image/jpeg' })
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback, type?: string, quality?: number) => {
        expect(type).toBe('image/jpeg')
        expect(quality).toBe(0.9)
        callback(blob)
      }),
    } as unknown as HTMLCanvasElement

    const result = await canvasToFile(canvas, sourceFile, {
      outputType: 'image/jpeg',
      outputQuality: 0.9,
    })

    expect(result.name).toBe('avatar.jpg')
    expect(result.type).toBe('image/jpeg')
  })

  it('validates minimum image dimensions', () => {
    const image = {
      naturalWidth: 256,
      naturalHeight: 128,
    } as HTMLImageElement

    expect(validateImageDimensions(image, { minWidth: 128, minHeight: 128 })).toBe(true)
    expect(validateImageDimensions(image, { minWidth: 512 })).toBe(false)
    expect(validateImageDimensions(image, { minHeight: 256 })).toBe(false)
  })
})
