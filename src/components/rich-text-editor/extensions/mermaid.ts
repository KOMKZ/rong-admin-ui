import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import MermaidBlock from '../components/MermaidBlock.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaidBlock: {
      insertMermaidBlock: (code?: string) => ReturnType
    }
  }
}

export const MermaidBlockExtension = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: 'graph TD;\nA-->B;',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'mermaid-block' }]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['mermaid-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return VueNodeViewRenderer(MermaidBlock)
  },

  addCommands() {
    return {
      insertMermaidBlock:
        (code?: string) =>
        ({ chain }: { chain: any }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { code: code || 'graph TD;\nA-->B;' },
            })
            .scrollIntoView()
            .run()
        },
    }
  },
})
