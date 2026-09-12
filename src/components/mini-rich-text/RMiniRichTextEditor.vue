<script setup lang="ts">
  import './mini-rich-text.css'
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import type {
    MiniRichTextBlockTag,
    MiniRichTextEditorProps,
    MiniRichTextPreviewMode,
  } from './types'
  import { inspectMiniRichTextCompatibility } from './compatibility'
  import { MINI_RICH_TEXT_COLOR_PALETTE, MINI_RICH_TEXT_DEVICE_OPTIONS } from './constants'
  import RMiniRichTextImageBox from './RMiniRichTextImageBox.vue'
  import RMiniRichTextToolbar from './RMiniRichTextToolbar.vue'
  import { sanitizeMiniRichText } from './sanitize'

  defineOptions({ name: 'RMiniRichTextEditor' })

  const props = withDefaults(defineProps<MiniRichTextEditorProps>(), {
    modelValue: '',
    placeholder: '请输入适合小程序展示的正文详情',
    disabled: false,
    readonly: false,
    height: 260,
    imageUploadAdapter: undefined,
    enableFullscreenPreview: true,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
    focus: []
    blur: []
    imageUploadError: [error: Error]
  }>()

  const editorRef = ref<HTMLElement | null>(null)
  const editorShellRef = ref<HTMLElement | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const uploadingImage = ref(false)
  const focused = ref(false)
  const fullscreen = ref(false)
  const previewMode = ref<MiniRichTextPreviewMode>('mini')
  const previewDevice = ref('iphone-15')
  const selectedImage = ref<HTMLImageElement | null>(null)
  const colorValue = ref('#172033')
  const imageBox = ref({ visible: false, left: 0, top: 0, width: 0, height: 0 })
  const resizingImage = ref<{
    image: HTMLImageElement
    startX: number
    startWidth: number
    maxWidth: number
  } | null>(null)

  const isDisabled = computed(() => props.disabled || props.readonly)
  const imageSelected = computed(() => Boolean(selectedImage.value))
  const imageUploadEnabled = computed(() => Boolean(props.imageUploadAdapter))
  const editorStyle = computed(() => ({
    minHeight: typeof props.height === 'number' ? `${props.height}px` : props.height,
  }))
  const safeContent = computed(() => sanitizeMiniRichText(props.modelValue || ''))
  const compatibilityIssues = computed(() =>
    inspectMiniRichTextCompatibility(props.modelValue || ''),
  )
  const currentDevice = computed(
    () => deviceOptions.find((item) => item.value === previewDevice.value) || deviceOptions[0],
  )
  const phoneStyle = computed(() => ({
    width: `${currentDevice.value.width}px`,
    height: `${currentDevice.value.height}px`,
  }))

  const deviceOptions = MINI_RICH_TEXT_DEVICE_OPTIONS
  const colorPalette = MINI_RICH_TEXT_COLOR_PALETTE

  watch(
    () => props.modelValue,
    (value) => {
      const editor = editorRef.value
      if (!editor || focused.value) return
      const nextValue = sanitizeMiniRichText(value || '')
      if (editor.innerHTML !== nextValue) {
        editor.innerHTML = nextValue
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    const editor = editorRef.value
    if (editor) {
      editor.innerHTML = sanitizeMiniRichText(props.modelValue || '')
    }
  })

  onBeforeUnmount(() => {
    removeResizeListeners()
  })

  function runCommand(command: string, value?: string): void {
    if (isDisabled.value) return
    editorRef.value?.focus()
    document.execCommand(command, false, value)
    syncValue()
  }

  function formatBlock(tag: MiniRichTextBlockTag): void {
    runCommand('formatBlock', tag)
  }

  function handleToolbarCommand(command: string): void {
    if (command === 'createLink') {
      createLink()
      return
    }
    runCommand(command)
  }

  function setTextColor(value: string): void {
    colorValue.value = value
    runCommand('foreColor', value)
  }

  function applyAlignment(align: 'left' | 'center' | 'right'): void {
    const image = selectedImage.value
    if (image) {
      const wrapper = image.closest('p,div') as HTMLElement | null
      image.style.display = 'inline-block'
      image.style.margin = '12px 0'
      if (wrapper) {
        wrapper.style.textAlign = align
      }
      updateImageBox()
      syncValue()
      return
    }
    runCommand(`justify${align.charAt(0).toUpperCase()}${align.slice(1)}`)
  }

  function resizeSelectedImage(width: string): void {
    const image = selectedImage.value
    if (!image) return
    image.setAttribute('width', width)
    image.style.width = width
    image.style.maxWidth = '100%'
    image.style.height = 'auto'
    updateImageBox()
    syncValue()
  }

  function createLink(): void {
    if (isDisabled.value) return
    const url = window.prompt('请输入链接地址')
    if (!url) return
    const trimmed = url.trim()
    if (!/^(https?:\/\/|\/)/i.test(trimmed)) return
    runCommand('createLink', trimmed)
  }

  function triggerImageUpload(): void {
    if (isDisabled.value || uploadingImage.value) return
    fileInputRef.value?.click()
  }

  async function handleImageChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file || !props.imageUploadAdapter) return
    uploadingImage.value = true
    try {
      const result = await props.imageUploadAdapter.upload(file)
      insertImage(result.url, result.alt || file.name)
    } catch (cause) {
      emit('imageUploadError', cause instanceof Error ? cause : new Error(String(cause)))
    } finally {
      uploadingImage.value = false
    }
  }

  function insertImage(url: string, alt: string): void {
    if (!url.trim()) return
    editorRef.value?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<p><img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" style="max-width: 100%; height: auto;"></p>`,
    )
    syncValue()
  }

  function handleEditorClick(event: MouseEvent): void {
    const target = event.target
    selectedImage.value = target instanceof HTMLImageElement ? target : null
    updateImageBox()
  }

  function handleEditorScroll(): void {
    updateImageBox()
  }

  function updateImageBox(): void {
    void nextTick(() => {
      const image = selectedImage.value
      const shell = editorShellRef.value
      if (!image || !shell || !shell.contains(image)) {
        imageBox.value.visible = false
        return
      }
      const rect = image.getBoundingClientRect()
      const shellRect = shell.getBoundingClientRect()
      imageBox.value = {
        visible: true,
        left: rect.left - shellRect.left,
        top: rect.top - shellRect.top,
        width: rect.width,
        height: rect.height,
      }
    })
  }

  function startImageResize(event: MouseEvent): void {
    const image = selectedImage.value
    const editor = editorRef.value
    if (!image || !editor) return
    event.preventDefault()
    event.stopPropagation()
    resizingImage.value = {
      image,
      startX: event.clientX,
      startWidth: image.getBoundingClientRect().width,
      maxWidth: Math.max(96, editor.clientWidth - 24),
    }
    document.addEventListener('mousemove', handleImageResizeMove)
    document.addEventListener('mouseup', stopImageResize)
  }

  function handleImageResizeMove(event: MouseEvent): void {
    const state = resizingImage.value
    if (!state) return
    const nextWidth = Math.min(
      state.maxWidth,
      Math.max(80, state.startWidth + event.clientX - state.startX),
    )
    state.image.setAttribute('width', `${Math.round(nextWidth)}px`)
    state.image.style.width = `${Math.round(nextWidth)}px`
    state.image.style.maxWidth = '100%'
    state.image.style.height = 'auto'
    updateImageBox()
  }

  function stopImageResize(): void {
    if (!resizingImage.value) return
    resizingImage.value = null
    removeResizeListeners()
    syncValue()
  }

  function removeResizeListeners(): void {
    document.removeEventListener('mousemove', handleImageResizeMove)
    document.removeEventListener('mouseup', stopImageResize)
  }

  function handlePaste(event: ClipboardEvent): void {
    if (isDisabled.value) return
    const html = event.clipboardData?.getData('text/html')
    const text = event.clipboardData?.getData('text/plain')
    if (!html && !text) return
    event.preventDefault()
    const raw = html || text || ''
    const pasted = html || looksLikeHtml(raw) ? raw : textToHtml(raw)
    document.execCommand('insertHTML', false, sanitizeMiniRichText(pasted))
    syncValue()
  }

  function handleInput(): void {
    syncValue()
  }

  function handleFocus(): void {
    focused.value = true
    emit('focus')
  }

  function handleBlur(): void {
    focused.value = false
    syncValue()
    emit('blur')
  }

  function syncValue(): void {
    void nextTick(() => {
      const value = sanitizeMiniRichText(editorRef.value?.innerHTML || '')
      emit('update:modelValue', value)
      updateImageBox()
    })
  }

  function openFullscreen(): void {
    fullscreen.value = true
    selectedImage.value = null
    imageBox.value.visible = false
    void nextTick(() => {
      const fullscreenEditor = document.querySelector<HTMLElement>(
        '.r-mini-rich-editor__fullscreen .r-mini-rich-editor__input',
      )
      if (fullscreenEditor)
        fullscreenEditor.innerHTML = sanitizeMiniRichText(props.modelValue || '')
    })
  }

  function closeFullscreen(): void {
    fullscreen.value = false
    selectedImage.value = null
    imageBox.value.visible = false
    void nextTick(() => {
      const editor = editorRef.value
      if (editor) editor.innerHTML = sanitizeMiniRichText(props.modelValue || '')
    })
  }

  function looksLikeHtml(value: string): boolean {
    return /<\/?[a-z][\s\S]*>/i.test(value.trim())
  }

  function textToHtml(text: string): string {
    return text
      .split(/\n{2,}/)
      .map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`)
      .join('')
  }

  function escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function escapeAttr(value: string): string {
    return escapeHtml(value)
  }
</script>

<template>
  <section
    class="r-mini-rich-editor"
    :class="{ 'r-mini-rich-editor--disabled': isDisabled }"
    data-testid="mini-rich-text-editor"
  >
    <template v-if="!fullscreen">
      <RMiniRichTextToolbar
        v-if="!readonly"
        :color-value="colorValue"
        :color-palette="colorPalette"
        :image-selected="imageSelected"
        :image-upload-enabled="imageUploadEnabled"
        :uploading-image="uploadingImage"
        :show-fullscreen="enableFullscreenPreview"
        @command="handleToolbarCommand"
        @format-block="formatBlock"
        @align="applyAlignment"
        @text-color="setTextColor"
        @image-width="resizeSelectedImage"
        @image-upload="triggerImageUpload"
        @fullscreen="openFullscreen"
      />
      <div ref="editorShellRef" class="r-mini-rich-editor__shell">
        <div
          ref="editorRef"
          class="r-mini-rich-editor__input"
          :class="{ 'is-empty': !modelValue }"
          :contenteditable="!isDisabled"
          :data-placeholder="placeholder"
          :style="editorStyle"
          @click="handleEditorClick"
          @input="handleInput"
          @scroll="handleEditorScroll"
          @paste="handlePaste"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <RMiniRichTextImageBox :box="imageBox" @resize-start="startImageResize" />
      </div>
    </template>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      hidden
      @change="handleImageChange"
    />

    <teleport to="body">
      <div v-if="fullscreen" class="r-mini-rich-editor__fullscreen">
        <button
          type="button"
          class="r-mini-rich-editor__fullscreen-close"
          title="退出全屏"
          @click="closeFullscreen"
        >
          ×
        </button>
        <div class="r-mini-rich-editor__fullscreen-head">
          <div>
            <div class="r-mini-rich-editor__fullscreen-title">详情正文</div>
            <div class="r-mini-rich-editor__fullscreen-subtitle">
              左侧编辑，右侧验证不同端的渲染效果
            </div>
          </div>
          <div class="r-mini-rich-editor__fullscreen-actions">
            <select v-model="previewMode" class="r-mini-rich-editor__select">
              <option value="mini">小程序渲染</option>
              <option value="web">Web 渲染</option>
            </select>
            <select
              v-if="previewMode === 'mini'"
              v-model="previewDevice"
              class="r-mini-rich-editor__select"
            >
              <option v-for="device in deviceOptions" :key="device.value" :value="device.value">
                {{ device.label }}
              </option>
            </select>
            <button type="button" class="r-mini-rich-editor__exit" @click="closeFullscreen">
              退出全屏
            </button>
          </div>
        </div>
        <div class="r-mini-rich-editor__fullscreen-body">
          <div class="r-mini-rich-editor__fullscreen-edit">
            <RMiniRichTextToolbar
              :color-value="colorValue"
              :color-palette="colorPalette"
              :image-selected="imageSelected"
              :image-upload-enabled="imageUploadEnabled"
              :uploading-image="uploadingImage"
              @command="handleToolbarCommand"
              @format-block="formatBlock"
              @align="applyAlignment"
              @text-color="setTextColor"
              @image-width="resizeSelectedImage"
              @image-upload="triggerImageUpload"
            />
            <div ref="editorShellRef" class="r-mini-rich-editor__shell">
              <div
                ref="editorRef"
                class="r-mini-rich-editor__input"
                :class="{ 'is-empty': !modelValue }"
                contenteditable="true"
                :data-placeholder="placeholder"
                @click="handleEditorClick"
                @input="handleInput"
                @scroll="handleEditorScroll"
                @paste="handlePaste"
                @focus="handleFocus"
                @blur="handleBlur"
              />
              <RMiniRichTextImageBox :box="imageBox" @resize-start="startImageResize" />
            </div>
          </div>
          <div class="r-mini-rich-editor__fullscreen-preview">
            <div
              v-if="compatibilityIssues.length"
              class="r-mini-rich-editor__compat"
              aria-label="小程序兼容检测"
            >
              <div
                v-for="issue in compatibilityIssues"
                :key="issue.message"
                class="r-mini-rich-editor__compat-item"
                :class="`r-mini-rich-editor__compat-item--${issue.level}`"
              >
                {{ issue.message }}
              </div>
            </div>
            <div v-if="previewMode === 'mini'" class="r-mini-rich-editor__phone-wrap">
              <div class="r-mini-rich-editor__phone" :style="phoneStyle">
                <div class="r-mini-rich-editor__phone-bar" />
                <div class="r-mini-rich-editor__phone-content">
                  <div
                    v-if="safeContent"
                    class="r-mini-rich-preview__body r-mini-rich-preview__body--mini"
                    v-html="safeContent"
                  />
                  <div v-else class="r-mini-rich-preview__empty">暂无详情内容</div>
                </div>
              </div>
            </div>
            <div v-else class="r-mini-rich-editor__web-preview">
              <div v-if="safeContent" class="r-mini-rich-preview__body" v-html="safeContent" />
              <div v-else class="r-mini-rich-preview__empty">暂无详情内容</div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>
