import { CodeBlock as TiptapCodeBlock } from '@tiptap/extension-code-block'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CodeBlockView from '../components/CodeBlockView.vue'

export const CodeBlock = TiptapCodeBlock.extend({
  addNodeView() {
    return VueNodeViewRenderer(CodeBlockView)
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-language') ||
          element.className.match(/language-(\w+)/)?.[1] ||
          null,
        renderHTML: (attributes) => {
          if (!attributes.language) return {}
          return {
            'data-language': attributes.language,
            class: `language-${attributes.language}`,
          }
        },
      },
    }
  },
})
