<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import type { AnyExtension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Underline } from '@tiptap/extension-underline'
import { CustomImage } from './extensions/image'
import { CodeBlock } from './extensions/code-block'
import { MermaidBlockExtension } from './extensions/mermaid'
import { GridBlockExtension } from './extensions/grid'
import { TableOfContentsExtension } from './extensions/toc'
import type {
  RichTextEditorTheme,
  ToolbarConfig,
  ImageUploadAdapter,
  FileUploadAdapter,
  RichTextEditorI18n,
  TiptapExtension,
} from './types'
import { useEditorTheme } from './composables/useEditorTheme'
import { useImageUpload } from './composables/useImageUpload'
import MenuBar from './components/MenuBar.vue'
import TableControlsOverlay from './components/TableControlsOverlay.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    readonly?: boolean
    preview?: boolean
    bordered?: boolean
    theme?: RichTextEditorTheme
    height?: string | number
    maxHeight?: string | number
    toolbar?: ToolbarConfig | false
    extensions?: TiptapExtension[]
    imageUploadAdapter?: ImageUploadAdapter
    fileUploadAdapter?: FileUploadAdapter
    i18n?: RichTextEditorI18n
  }>(),
  {
    modelValue: '',
    placeholder: '开始输入...',
    readonly: false,
    preview: false,
    bordered: true,
    theme: 'classic',
    height: undefined,
    maxHeight: undefined,
    toolbar: undefined,
    extensions: () => [],
    imageUploadAdapter: undefined,
    fileUploadAdapter: undefined,
    i18n: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  blur: []
  ready: [editor: InstanceType<typeof import('@tiptap/vue-3').Editor>]
}>()

const editorScrollRef = ref<HTMLElement | null>(null)
const showScrollTop = ref(false)
const isReadonly = computed(() => props.readonly || props.preview)

const { currentTheme, themes, activeTheme, setTheme } = useEditorTheme(props.theme)

const editor = useEditor({
  content: props.modelValue,
  editable: !isReadonly.value,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false,
    }) as AnyExtension,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Link.configure({ openOnClick: false }),
    Underline,
    CustomImage.configure({ inline: true, allowBase64: true }),
    Placeholder.configure({ placeholder: props.placeholder }),
    CodeBlock,
    MermaidBlockExtension,
    GridBlockExtension,
    TableOfContentsExtension,
    ...props.extensions,
  ],
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', ed.getHTML())
  },
  onFocus: () => emit('focus'),
  onBlur: () => emit('blur'),
  onCreate: ({ editor: ed }) => {
    emit('ready', ed as any)
  },
  editorProps: {
    handlePaste: (_view, event) => {
      const text = event.clipboardData?.getData('text/plain') || ''
      if (text && /^#{1,6}\s/.test(text)) {
        const html = markdownToBasicHtml(text)
        if (html) {
          editor.value?.chain().focus().insertContent(html).run()
          return true
        }
      }
      return false
    },
  },
})

function markdownToBasicHtml(md: string): string | null {
  const lines = md.split('\n')
  let hasMarkdown = false
  const html = lines
    .map((line) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
      if (headingMatch) {
        hasMarkdown = true
        const level = headingMatch[1].length
        return `<h${level}>${headingMatch[2]}</h${level}>`
      }
      return `<p>${line}</p>`
    })
    .join('')
  return hasMarkdown ? html : null
}

const { triggerUpload: triggerImageUpload } = useImageUpload(
  () => editor.value ?? undefined,
  props.imageUploadAdapter,
)

function triggerFileUpload() {
  if (!props.fileUploadAdapter) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar'
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file || !props.fileUploadAdapter || !editor.value) return
    try {
      const result = await props.fileUploadAdapter.upload(file)
      editor.value
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: result.url })
        .insertContent(result.name || file.name)
        .run()
    } catch (err) {
      console.error('[RRichTextEditor] File upload failed:', err)
    }
  })
  input.click()
}

const normalizedHeight = computed(() => {
  if (!props.height) return undefined
  return typeof props.height === 'number' ? `${props.height}px` : props.height
})

const normalizedMaxHeight = computed(() => {
  if (!props.maxHeight) return undefined
  return typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
})

watch(
  () => isReadonly.value,
  (val) => {
    editor.value?.setEditable(!val)
  },
)

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getHTML() !== newValue) {
      editor.value.commands.setContent(newValue ?? '', { emitUpdate: false })
    }
  },
)

watch(
  () => props.theme,
  (v) => setTheme(v),
)

function handleScroll() {
  const container = editorScrollRef.value
  if (!container) return
  showScrollTop.value = container.scrollTop > 400
}

function scrollToTop() {
  editorScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(
  () => editorScrollRef.value,
  (newEl, oldEl) => {
    oldEl?.removeEventListener('scroll', handleScroll)
    newEl?.addEventListener('scroll', handleScroll, { passive: true })
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
  editorScrollRef.value?.removeEventListener('scroll', handleScroll)
})

defineExpose({
  getEditor: () => editor.value,
  getHTML: () => editor.value?.getHTML() ?? '',
  getJSON: () => editor.value?.getJSON(),
})
</script>

<template>
  <div
    class="r-rich-text-editor"
    :class="[
      currentTheme.wrapperClass,
      {
        'r-rich-text-editor--bordered': bordered,
        'r-rich-text-editor--readonly': isReadonly,
      },
    ]"
    :style="{ height: normalizedHeight, maxHeight: normalizedMaxHeight }"
    data-testid="rich-text-editor"
  >
    <div v-if="!isReadonly" class="rrte-theme-switcher">
      <button
        v-for="t in themes"
        :key="t.id"
        class="rrte-theme-btn"
        :class="{ 'rrte-theme-btn--active': activeTheme === t.id }"
        :title="t.name"
        type="button"
        @click="setTheme(t.id)"
      >
        {{ t.name }}
      </button>
    </div>

    <MenuBar
      v-if="editor && !isReadonly"
      :editor="editor"
      :config="toolbar"
      :on-image-upload="imageUploadAdapter ? triggerImageUpload : undefined"
      :on-file-upload="fileUploadAdapter ? triggerFileUpload : undefined"
    />

    <div class="rrte-body">
      <div ref="editorScrollRef" class="rrte-scroll">
        <EditorContent
          v-if="editor"
          :editor="editor"
          class="rrte-content"
          :class="currentTheme.editorClass"
        />
        <TableControlsOverlay
          v-if="editor && !isReadonly"
          :editor="editor"
          :container="editorScrollRef"
        />
      </div>
    </div>

    <Transition name="rrte-fade">
      <button
        v-if="showScrollTop"
        class="rrte-scroll-top"
        type="button"
        aria-label="回到顶部"
        @click="scrollToTop"
      >
        ↑
      </button>
    </Transition>
  </div>
</template>

<style>
.r-rich-text-editor {
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--ra-color-bg-surface, #fff);
  border-radius: var(--ra-radius-lg, 8px);
  overflow: hidden;
}

.r-rich-text-editor--bordered {
  border: 1px solid var(--ra-color-border-default, #d0d7de);
}

.rrte-theme-classic {
  background: #fff;
}
.rrte-theme-minimal {
  background: linear-gradient(135deg, #f7f8fa, #eceff4);
}
.rrte-theme-midnight {
  background: radial-gradient(circle at top, #1f2a44, #0f172a);
  color: #e2e8f0;
}
.rrte-theme-aurora {
  background: linear-gradient(120deg, #4facfe 0%, #00f2fe 100%);
}

.rrte-theme-switcher {
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 15;
  display: flex;
  gap: 2px;
  border: 1px solid var(--ra-color-border-light, #e5e7eb);
  border-radius: var(--ra-radius-md, 4px);
  overflow: hidden;
}

.rrte-theme-btn {
  padding: 2px 8px;
  font-size: 11px;
  border: none;
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.15s ease;
}

.rrte-theme-btn:not(:last-child) {
  border-right: 1px solid var(--ra-color-border-light, #e5e7eb);
}

.rrte-theme-btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}

.rrte-theme-btn--active {
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
}

.rrte-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.rrte-scroll {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.rrte-content {
  min-height: 100%;
}

.rrte-editor-classic {
  background: transparent;
}
.rrte-editor-minimal {
  background: rgba(255, 255, 255, 0.85);
}
.rrte-editor-midnight {
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
}
.rrte-editor-midnight .ProseMirror {
  color: #f8fafc;
}
.rrte-editor-aurora {
  background: rgba(255, 255, 255, 0.9);
}

.r-rich-text-editor .ProseMirror {
  outline: none;
  min-height: 300px;
  padding: 16px 24px;
  font-family:
    'Helvetica Neue',
    'Segoe UI',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'PingFang SC',
    'Microsoft Yahei',
    sans-serif;
  font-size: 16px;
  line-height: 1.72;
  color: var(--ra-color-text-primary, #091e42);
}

.r-rich-text-editor .ProseMirror p {
  margin: 12px 0;
}
.r-rich-text-editor .ProseMirror strong {
  font-weight: 600;
}
.r-rich-text-editor .ProseMirror h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 40px 0 12px;
  line-height: 1.3;
}
.r-rich-text-editor .ProseMirror h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 32px 0 12px;
  line-height: 1.35;
}
.r-rich-text-editor .ProseMirror h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 10px;
  line-height: 1.4;
}
.r-rich-text-editor .ProseMirror h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 10px;
}
.r-rich-text-editor .ProseMirror h5 {
  font-size: 16px;
  font-weight: 600;
  margin: 18px 0 8px;
}
.r-rich-text-editor .ProseMirror h6 {
  font-size: 14px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--ra-color-text-tertiary, #5e6c84);
}
.r-rich-text-editor .ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.r-rich-text-editor .ProseMirror img.ProseMirror-selectednode {
  outline: 3px solid var(--ra-color-brand-primary, #68cef8);
}

.r-rich-text-editor .ProseMirror code:not(pre code) {
  background-color: rgba(9, 30, 66, 0.08);
  color: var(--ra-color-text-primary, #172b4d);
  padding: 0.12em 0.3em;
  border-radius: 3px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
  font-size: 0.95em;
}

.r-rich-text-editor .ProseMirror pre {
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-primary);
  font-family: 'JetBrains Mono', monospace;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.r-rich-text-editor .ProseMirror pre code {
  color: inherit;
  padding: 0;
  background: none;
  font-size: 0.8rem;
}

.r-rich-text-editor .ProseMirror mark {
  background-color: var(--ra-color-warning-bg);
  padding: 0.1em 0.3em;
  border-radius: 0.2em;
}

.r-rich-text-editor .ProseMirror table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 16px 0;
  overflow: hidden;
}
.r-rich-text-editor .ProseMirror table td,
.r-rich-text-editor .ProseMirror table th {
  min-width: 1em;
  border: 1px solid var(--ra-color-border-default, #ced4da);
  padding: 6px 8px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}
.r-rich-text-editor .ProseMirror table th {
  font-weight: bold;
  text-align: left;
  background-color: var(--ra-color-bg-muted, #f8f9fa);
}
.r-rich-text-editor .ProseMirror table .selectedCell::after {
  z-index: 2;
  position: absolute;
  content: '';
  inset: 0;
  background: rgba(200, 200, 255, 0.4);
  pointer-events: none;
}
.r-rich-text-editor .ProseMirror table .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: var(--ra-color-info-border);
  pointer-events: none;
}

.r-rich-text-editor .ProseMirror ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.r-rich-text-editor .ProseMirror ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.r-rich-text-editor .ProseMirror ul[data-type='taskList'] {
  list-style: none;
  padding: 0;
}
.r-rich-text-editor .ProseMirror ul[data-type='taskList'] li {
  display: flex;
  align-items: flex-start;
}
.r-rich-text-editor .ProseMirror ul[data-type='taskList'] li > label {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}
.r-rich-text-editor .ProseMirror ul[data-type='taskList'] li > div {
  flex: 1 1 auto;
}
.r-rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--ra-color-text-quaternary, #adb5bd);
  pointer-events: none;
  height: 0;
}

.rrte-scroll-top {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 25;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  box-shadow: var(--ra-shadow-lg, 0 10px 20px rgba(15, 23, 42, 0.25));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.rrte-scroll-top:hover {
  transform: translateY(-2px);
}
.rrte-fade-enter-active,
.rrte-fade-leave-active {
  transition: opacity 0.2s;
}
.rrte-fade-enter-from,
.rrte-fade-leave-to {
  opacity: 0;
}
</style>
