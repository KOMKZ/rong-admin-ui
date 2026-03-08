import Image from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Component } from 'vue'
import ImageNodeView from '../components/ImageNodeView.vue'

export interface CustomImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customImage: {
      setImageAlign: (align: 'left' | 'center' | 'right') => ReturnType
      setImageWidth: (width: number | string | null) => ReturnType
    }
  }
}

export const CustomImage = Image.extend<CustomImageOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width') || element.style.width || null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          const width = typeof attributes.width === 'number'
            ? `${attributes.width}px`
            : attributes.width
          return { style: `width: ${width}` }
        },
      },
      textAlign: {
        default: 'center',
        parseHTML: (element) => {
          const parent = element.parentElement
          if (parent?.style.textAlign) return parent.style.textAlign
          return element.getAttribute('data-text-align') || 'center'
        },
        renderHTML: (attributes) => ({
          'data-text-align': attributes.textAlign,
        }),
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageNodeView as Component)
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align: 'left' | 'center' | 'right') =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { textAlign: align })
        },
      setImageWidth:
        (width: number | string | null) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { width })
        },
    }
  },
})
