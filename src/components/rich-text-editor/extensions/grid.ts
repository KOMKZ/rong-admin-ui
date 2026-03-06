import { Node, mergeAttributes, findChildren } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GridNodeView from '../components/GridNodeView.vue'

export const defaultGridTableData = {
  structure: [] as any[],
  data: [] as any[],
  columnOrder: [] as string[],
  meta: { totalRows: 0, totalColumns: 0 },
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gridBlock: {
      insertGridBlock: () => ReturnType
    }
  }
}

export const GridBlockExtension = Node.create({
  name: 'gridBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: { default: '数据表格' },
      tableData: { default: JSON.stringify(defaultGridTableData) },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'grid-block',
        getAttrs: (node: string | HTMLElement) => {
          if (typeof node === 'string') return {}
          const el = node
          return {
            title: el.getAttribute('title') || '数据表格',
            tableData: el.getAttribute('tableData') || JSON.stringify(defaultGridTableData),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['grid-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return VueNodeViewRenderer(GridNodeView)
  },

  addCommands() {
    return {
      insertGridBlock:
        () =>
        ({ chain }: { chain: any }) => {
          return chain()
            .insertContent({ type: this.name })
            .scrollIntoView()
            .run()
        },
    }
  },
})

export function extractGridBlocks(doc: any) {
  if (!doc) return []
  const blocks = findChildren(doc, (node: any) => node.type?.name === 'gridBlock')
  return blocks.map(({ node, pos }: { node: any; pos: number }) => {
    let tableData = defaultGridTableData
    try {
      tableData = JSON.parse(node.attrs?.tableData || '{}')
    } catch { /* ignore */ }
    return { pos, title: node.attrs?.title || '', tableData }
  })
}
