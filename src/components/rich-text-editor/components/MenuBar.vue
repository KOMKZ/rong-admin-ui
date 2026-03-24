<script lang="ts" setup>
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
</script>

<template>
  <div
    v-if="config !== false"
    class="rrte-menubar"
    role="toolbar"
    aria-label="富文本工具栏"
    data-testid="rich-text-editor-toolbar"
  >
    <!-- Basic Formatting -->
    <div class="rrte-menubar__group">
      <ToolbarButton
        v-if="is('bold')"
        :active="editor.isActive('bold')"
        title="加粗"
        @click="edChain().toggleBold().run()"
      >
        <Bold :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('italic')"
        :active="editor.isActive('italic')"
        title="斜体"
        @click="edChain().toggleItalic().run()"
      >
        <Italic :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('underline')"
        :active="editor.isActive('underline')"
        title="下划线"
        @click="edChain().toggleUnderline().run()"
      >
        <Underline :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('strike')"
        :active="editor.isActive('strike')"
        title="删除线"
        @click="edChain().toggleStrike().run()"
      >
        <Strikethrough :size="16" />
      </ToolbarButton>
      <ToolbarButton
        :active="editor.isActive('code')"
        title="行内代码"
        @click="edChain().toggleCode().run()"
      >
        <Code :size="16" />
      </ToolbarButton>

      <!-- Highlight Dropdown -->
      <div v-if="is('highlight')" class="rrte-menubar__dropdown-wrap">
        <ToolbarButton
          :active="editor.isActive('highlight')"
          title="高亮"
          @click.stop="toggleMenu('highlight')"
        >
          <Highlighter :size="16" />
        </ToolbarButton>
        <div v-if="showHighlightMenu" class="rrte-menubar__dropdown rrte-menubar__dropdown--colors">
          <div
            v-for="color in HIGHLIGHT_COLORS"
            :key="color"
            class="rrte-color-swatch"
            :style="{ backgroundColor: color }"
            @click="setHighlight(color)"
          />
          <button class="rrte-color-clear" @click="clearHighlight" title="清除高亮">
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>

    <span class="rrte-menubar__divider" />

    <!-- Headings -->
    <div class="rrte-menubar__group">
      <ToolbarButton
        v-if="is('heading')"
        :active="editor.isActive('heading', { level: 1 })"
        title="标题 1"
        @click="edChain().toggleHeading({ level: 1 }).run()"
      >
        <Heading1 :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('heading')"
        :active="editor.isActive('heading', { level: 2 })"
        title="标题 2"
        @click="edChain().toggleHeading({ level: 2 }).run()"
      >
        <Heading2 :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('heading')"
        :active="editor.isActive('heading', { level: 3 })"
        title="标题 3"
        @click="edChain().toggleHeading({ level: 3 }).run()"
      >
        <Heading3 :size="16" />
      </ToolbarButton>
    </div>

    <span class="rrte-menubar__divider" />

    <!-- Lists -->
    <div class="rrte-menubar__group">
      <ToolbarButton
        v-if="is('bulletList')"
        :active="editor.isActive('bulletList')"
        title="无序列表"
        @click="edChain().toggleBulletList().run()"
      >
        <List :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('orderedList')"
        :active="editor.isActive('orderedList')"
        title="有序列表"
        @click="edChain().toggleOrderedList().run()"
      >
        <ListOrdered :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('taskList')"
        :active="editor.isActive('taskList')"
        title="任务列表"
        @click="edChain().toggleTaskList().run()"
      >
        <ListChecks :size="16" />
      </ToolbarButton>
    </div>

    <span class="rrte-menubar__divider" />

    <!-- Block Elements -->
    <div class="rrte-menubar__group">
      <ToolbarButton
        v-if="is('blockquote')"
        :active="editor.isActive('blockquote')"
        title="引用"
        @click="edChain().toggleBlockquote().run()"
      >
        <Quote :size="16" />
      </ToolbarButton>

      <!-- Code Block Dropdown -->
      <div v-if="is('codeBlock')" class="rrte-menubar__dropdown-wrap">
        <ToolbarButton
          :active="editor.isActive('codeBlock')"
          title="代码块"
          @click.stop="toggleMenu('codeBlock')"
        >
          <Braces :size="16" />
        </ToolbarButton>
        <div v-if="showCodeBlockMenu" class="rrte-menubar__dropdown">
          <button
            v-for="lang in CODE_LANGUAGES"
            :key="lang.value"
            class="rrte-menubar__dropdown-item"
            @click="insertCodeBlock(lang.value)"
          >
            {{ lang.label }}
          </button>
          <div class="rrte-menubar__dropdown-sep" />
          <button class="rrte-menubar__dropdown-item" @click="insertCodeBlock(null)">
            普通代码块
          </button>
        </div>
      </div>

      <ToolbarButton
        v-if="is('horizontalRule')"
        title="分割线"
        @click="edChain().setHorizontalRule().run()"
      >
        <Minus :size="16" />
      </ToolbarButton>
    </div>

    <span class="rrte-menubar__divider" />

    <!-- Table Dropdown -->
    <div v-if="is('table')" class="rrte-menubar__dropdown-wrap">
      <ToolbarButton
        :active="editor.isActive('table')"
        title="表格"
        @click.stop="toggleMenu('table')"
      >
        <Table :size="16" />
      </ToolbarButton>
      <div v-if="showTableMenu" class="rrte-menubar__dropdown">
        <button class="rrte-menubar__dropdown-item" @click="insertTable">插入表格 (3×3)</button>
        <template v-if="editor.isActive('table')">
          <div class="rrte-menubar__dropdown-sep" />
          <button class="rrte-menubar__dropdown-item" @click="addColumnBefore">前插列</button>
          <button class="rrte-menubar__dropdown-item" @click="addColumnAfter">后插列</button>
          <button
            class="rrte-menubar__dropdown-item rrte-menubar__dropdown-item--danger"
            @click="deleteColumn"
          >
            删除列
          </button>
          <div class="rrte-menubar__dropdown-sep" />
          <button class="rrte-menubar__dropdown-item" @click="addRowBefore">前插行</button>
          <button class="rrte-menubar__dropdown-item" @click="addRowAfter">后插行</button>
          <button
            class="rrte-menubar__dropdown-item rrte-menubar__dropdown-item--danger"
            @click="deleteRow"
          >
            删除行
          </button>
          <div class="rrte-menubar__dropdown-sep" />
          <button class="rrte-menubar__dropdown-item" @click="mergeCells">合并单元格</button>
          <button class="rrte-menubar__dropdown-item" @click="splitCell">拆分单元格</button>
          <button class="rrte-menubar__dropdown-item" @click="toggleHeaderRow">切换表头</button>
          <div class="rrte-menubar__dropdown-sep" />
          <button
            class="rrte-menubar__dropdown-item rrte-menubar__dropdown-item--danger"
            @click="deleteTable"
          >
            删除表格
          </button>
        </template>
      </div>
    </div>

    <span class="rrte-menubar__divider" />

    <!-- Insert Objects -->
    <div class="rrte-menubar__group">
      <!-- Link -->
      <div v-if="is('link')" class="rrte-menubar__dropdown-wrap">
        <ToolbarButton
          :active="editor.isActive('link')"
          title="链接"
          @click.stop="toggleMenu('link')"
        >
          <Link :size="16" />
        </ToolbarButton>
        <div v-if="showLinkInput" class="rrte-menubar__dropdown rrte-menubar__dropdown--link">
          <input
            v-model="linkUrl"
            class="rrte-link-input"
            placeholder="输入 URL..."
            @keyup.enter="confirmLink"
          />
          <button class="rrte-link-confirm" @click="confirmLink">确定</button>
          <button v-if="editor.isActive('link')" class="rrte-link-remove" @click="removeLink">
            <X :size="12" /> 移除
          </button>
        </div>
      </div>

      <ToolbarButton v-if="is('image') && onImageUpload" title="插入图片" @click="onImageUpload">
        <Image :size="16" />
      </ToolbarButton>

      <ToolbarButton v-if="onFileUpload" title="插入附件" @click="onFileUpload">
        <Paperclip :size="16" />
      </ToolbarButton>

      <ToolbarButton title="插入 Mermaid 图" @click="insertMermaid">
        <GitBranch :size="16" />
      </ToolbarButton>

      <ToolbarButton title="插入表格块" @click="insertGrid">
        <LayoutGrid :size="16" />
      </ToolbarButton>

      <ToolbarButton title="插入目录" @click="insertToc">
        <TableOfContents :size="16" />
      </ToolbarButton>
    </div>

    <span class="rrte-menubar__divider" />

    <!-- History -->
    <div class="rrte-menubar__group">
      <ToolbarButton
        v-if="is('undo')"
        :disabled="!editor.can().undo()"
        title="撤销"
        @click="edChain().undo().run()"
      >
        <Undo2 :size="16" />
      </ToolbarButton>
      <ToolbarButton
        v-if="is('redo')"
        :disabled="!editor.can().redo()"
        title="重做"
        @click="edChain().redo().run()"
      >
        <Redo2 :size="16" />
      </ToolbarButton>
    </div>
  </div>
</template>

<style>
.rrte-menubar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--ra-color-border-light, #e5e7eb);
  background: var(--ra-color-bg-surface-secondary, #f6f8fa);
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.rrte-menubar__group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.rrte-menubar__divider {
  width: 1px;
  height: 20px;
  background: var(--ra-color-border-light, #e5e7eb);
  margin: 0 4px;
}

/* Dropdown */
.rrte-menubar__dropdown-wrap {
  position: relative;
}

.rrte-menubar__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  min-width: 160px;
  padding: 4px;
  background: var(--ra-color-bg-surface, #fff);
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 6px);
  box-shadow: var(--ra-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));
  margin-top: 4px;
}

.rrte-menubar__dropdown--colors {
  display: flex;
  gap: 4px;
  padding: 8px;
  min-width: auto;
  flex-wrap: wrap;
  align-items: center;
}

.rrte-menubar__dropdown--link {
  display: flex;
  gap: 4px;
  padding: 8px;
  min-width: 280px;
  align-items: center;
}

.rrte-menubar__dropdown-item {
  display: block;
  width: 100%;
  padding: 5px 10px;
  font-size: 13px;
  text-align: left;
  border: none;
  border-radius: var(--ra-radius-sm, 3px);
  background: transparent;
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.1s ease;
}

.rrte-menubar__dropdown-item:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
  color: var(--ra-color-text-primary, #24292f);
}

.rrte-menubar__dropdown-item--danger {
  color: var(--ra-color-danger, #cf222e);
}

.rrte-menubar__dropdown-item--danger:hover {
  background: #fef2f2;
}

.rrte-menubar__dropdown-sep {
  height: 1px;
  background: var(--ra-color-border-light, #e5e7eb);
  margin: 4px 0;
}

/* Color swatch */
.rrte-color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--ra-color-border-light, #e5e7eb);
  transition: transform 0.1s ease;
}

.rrte-color-swatch:hover {
  transform: scale(1.15);
}

.rrte-color-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--ra-color-border-light, #e5e7eb);
  background: var(--ra-color-bg-surface, #fff);
  cursor: pointer;
  color: var(--ra-color-text-secondary, #57606a);
}

.rrte-color-clear:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}

/* Link input */
.rrte-link-input {
  flex: 1;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-sm, 4px);
  outline: none;
}

.rrte-link-input:focus {
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rrte-link-confirm {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: var(--ra-radius-sm, 4px);
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
}

.rrte-link-confirm:hover {
  opacity: 0.9;
}

.rrte-link-remove {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-radius: var(--ra-radius-sm, 4px);
  background: transparent;
  color: var(--ra-color-danger, #cf222e);
  cursor: pointer;
}

.rrte-link-remove:hover {
  background: #fef2f2;
}
</style>
