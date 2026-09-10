<script lang="ts" setup>
import './RRichTextEditor.css'
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
    RRichTextEditorExpose,
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
    ready: [editor: unknown]
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
      ...(props.extensions as AnyExtension[]),
    ],
    onUpdate: ({ editor: ed }) => {
      emit('update:modelValue', ed.getHTML())
    },
    onFocus: () => emit('focus'),
    onBlur: () => emit('blur'),
    onCreate: ({ editor: ed }) => {
      emit('ready', ed)
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

  defineExpose<RRichTextEditorExpose>({
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

