<script lang="ts" setup>
import './MenuBar.css'
  import type { Editor } from '@tiptap/vue-3'
  import type { ToolbarConfig } from '../types'
  import ToolbarButton from './ToolbarButton.vue'
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Highlighter,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Braces,
    Minus,
    Table,
    Link,
    Image,
    Paperclip,
    GitBranch,
    LayoutGrid,
    TableOfContents,
    Undo2,
    Redo2,
    X,
  } from 'lucide-vue-next'

  const props = defineProps<{
    editor: Editor
    config?: ToolbarConfig | false
    onImageUpload?: () => void
    onFileUpload?: () => void
  }>()

  /** TipTap ChainedCommands typing does not include all StarterKit / extension commands. */
  function edChain() {
    return props.editor.chain().focus() as any
  }

  function is(key: keyof ToolbarConfig): boolean {
    if (props.config === false) return false
    if (!props.config) return true
    return props.config[key] !== false
  }

  // Dropdown state
  const showTableMenu = ref(false)
  const showCodeBlockMenu = ref(false)
  const showHighlightMenu = ref(false)
  const showLinkInput = ref(false)
  const linkUrl = ref('')

  function closeAllMenus() {
    showTableMenu.value = false
    showCodeBlockMenu.value = false
    showHighlightMenu.value = false
    showLinkInput.value = false
  }

  function toggleMenu(menu: 'table' | 'codeBlock' | 'highlight' | 'link') {
    const isOpen =
      menu === 'table'
        ? showTableMenu.value
        : menu === 'codeBlock'
          ? showCodeBlockMenu.value
          : menu === 'highlight'
            ? showHighlightMenu.value
            : showLinkInput.value
    closeAllMenus()
    if (!isOpen) {
      if (menu === 'table') showTableMenu.value = true
      else if (menu === 'codeBlock') showCodeBlockMenu.value = true
      else if (menu === 'highlight') showHighlightMenu.value = true
      else showLinkInput.value = true
    }
  }

  function handleClickOutside(e: MouseEvent) {
    const toolbar = (e.target as Element)?.closest('.rrte-menubar')
    if (!toolbar) closeAllMenus()
  }

  onMounted(() => document.addEventListener('click', handleClickOutside))
  onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

  function insertCodeBlock(lang: string | null) {
    if (lang) {
      edChain().toggleCodeBlock({ language: lang }).run()
    } else {
      edChain().toggleCodeBlock().run()
    }
    closeAllMenus()
  }

  const HIGHLIGHT_COLORS = ['#ffe066', '#ffccc7', '#b7eb8f', '#91caff', '#d3adf7', '#f5f5f5']

  function setHighlight(color: string) {
    edChain().toggleHighlight({ color }).run()
    closeAllMenus()
  }

  function clearHighlight() {
    edChain().unsetHighlight().run()
    closeAllMenus()
  }

  function insertTable() {
    edChain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    closeAllMenus()
  }

  function addColumnBefore() {
    edChain().addColumnBefore().run()
    closeAllMenus()
  }

  function addColumnAfter() {
    edChain().addColumnAfter().run()
    closeAllMenus()
  }

  function deleteColumn() {
    edChain().deleteColumn().run()
    closeAllMenus()
  }

  function addRowBefore() {
    edChain().addRowBefore().run()
    closeAllMenus()
  }

  function addRowAfter() {
    edChain().addRowAfter().run()
    closeAllMenus()
  }

  function deleteRow() {
    edChain().deleteRow().run()
    closeAllMenus()
  }

  function mergeCells() {
    edChain().mergeCells().run()
    closeAllMenus()
  }

  function splitCell() {
    edChain().splitCell().run()
    closeAllMenus()
  }

  function toggleHeaderRow() {
    edChain().toggleHeaderRow().run()
    closeAllMenus()
  }

  function deleteTable() {
    edChain().deleteTable().run()
    closeAllMenus()
  }

  function removeLink() {
    edChain().unsetLink().run()
    closeAllMenus()
  }

  function confirmLink() {
    if (linkUrl.value) {
      edChain().extendMarkRange('link').setLink({ href: linkUrl.value }).run()
    } else {
      edChain().unsetLink().run()
    }
    linkUrl.value = ''
    showLinkInput.value = false
  }

  function insertMermaid() {
    const template =
      'graph TD;\n  A[开始] --> B{条件?};\n  B -- 是 --> C[执行任务];\n  B -- 否 --> D[结束];'
    edChain().insertMermaidBlock(template).run()
  }

  function insertGrid() {
    edChain().insertGridBlock().run()
  }

  function insertToc() {
    edChain().insertTableOfContents().run()
  }

  const CODE_LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'Go', value: 'go' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JSON', value: 'json' },
    { label: 'SQL', value: 'sql' },
    { label: 'Shell', value: 'bash' },
  ]
void [Bold, Braces, CODE_LANGUAGES, Code, GitBranch, HIGHLIGHT_COLORS, Heading1, Heading2, Heading3, Highlighter, Image, Italic, LayoutGrid, Link, List, ListChecks, ListOrdered, Minus, Paperclip, Quote, Redo2, Strikethrough, Table, TableOfContents, ToolbarButton, Underline, Undo2, X, addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, clearHighlight, confirmLink, deleteColumn, deleteRow, deleteTable, insertCodeBlock, insertGrid, insertMermaid, insertTable, insertToc, is, mergeCells, removeLink, setHighlight, splitCell, toggleHeaderRow, toggleMenu]
</script>

<template src="./MenuBar.template.html"></template>

