import type { Editor } from '@tiptap/vue-3'
import type { ImageUploadAdapter } from '../types'

export function useImageUpload(getEditor: () => Editor | undefined, adapter?: ImageUploadAdapter) {
  function triggerUpload() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return
      await uploadAndInsert(file)
    })
    input.click()
  }

  async function uploadAndInsert(file: File) {
    const editor = getEditor()
    if (!editor) return

    if (adapter) {
      try {
        const url = await adapter.upload(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch (err) {
        console.error('[RRichTextEditor] Image upload failed:', err)
      }
    } else {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        const base64 = reader.result as string
        editor.chain().focus().setImage({ src: base64 }).run()
      })
      reader.readAsDataURL(file)
    }
  }

  return { triggerUpload, uploadAndInsert }
}
