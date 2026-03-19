<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput } from 'naive-ui'
import { PanelRightClose, PanelRight, Send } from 'lucide-vue-next'

interface Props {
  visible?: boolean
  content?: string
  title?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'apply', content: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  content: '',
  title: 'Artifact',
})

const emit = defineEmits<Emits>()

const collapsed = ref(false)
const editedContent = ref(props.content)

function togglePanel() {
  collapsed.value = !collapsed.value
}

function handleApply() {
  emit('apply', editedContent.value || props.content || '')
}
</script>

<template>
  <div class="r-chat-canvas" :class="{ 'r-chat-canvas--collapsed': collapsed }">
    <div class="r-chat-canvas__header">
      <span class="r-chat-canvas__title">{{ title }}</span>
      <NButton
        quaternary
        size="small"
        circle
        :aria-label="collapsed ? '展开面板' : '收起面板'"
        @click="togglePanel"
      >
        <PanelRightClose v-if="collapsed" :size="16" />
        <PanelRight v-else :size="16" />
      </NButton>
    </div>
    <div v-show="!collapsed" class="r-chat-canvas__body">
      <NInput
        v-model:value="editedContent"
        type="textarea"
        :autosize="{ minRows: 8, maxRows: 24 }"
        placeholder="AI 生成的代码或文本将展示在这里，可编辑后应用到对话"
        class="r-chat-canvas__editor"
      />
      <div class="r-chat-canvas__actions">
        <NButton type="primary" size="small" @click="handleApply">
          <Send :size="14" style="margin-right: 4px" />
          Apply to conversation
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-chat-canvas {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--ra-color-border-light, #eef0f6);
  background: var(--ra-color-bg-surface, #fff);
  min-width: 200px;
}

.r-chat-canvas--collapsed {
  min-width: 40px;
}

.r-chat-canvas__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-3, 12px);
  border-bottom: 1px solid var(--ra-color-border-light, #eef0f6);
}

.r-chat-canvas__title {
  font-size: var(--ra-font-size-sm, 14px);
  font-weight: 500;
}

.r-chat-canvas__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--ra-spacing-3, 12px);
  overflow: hidden;
}

.r-chat-canvas__editor {
  flex: 1;
  margin-bottom: var(--ra-spacing-2, 8px);
}

.r-chat-canvas__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
