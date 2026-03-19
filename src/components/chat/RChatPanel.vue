<script setup lang="ts">
import { computed } from 'vue'
import { NButton } from 'naive-ui'
import { PanelLeftClose, PanelLeft } from 'lucide-vue-next'
import type { ChatConversation } from './types'

interface Props {
  conversations: ChatConversation[]
  activeConversationId?: number
  loading?: boolean
  sidebarCollapsed?: boolean
}

interface Emits {
  (e: 'select', id: number): void
  (e: 'create'): void
  (e: 'delete', id: number): void
  (e: 'rename', id: number, title: string): void
  (e: 'update:sidebarCollapsed', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), { loading: false, sidebarCollapsed: false })
const emit = defineEmits<Emits>()

const sidebarCollapsedLocal = computed({
  get: () => props.sidebarCollapsed,
  set: (v) => emit('update:sidebarCollapsed', v),
})

function toggleSidebar() {
  sidebarCollapsedLocal.value = !sidebarCollapsedLocal.value
}
</script>

<template>
  <div class="r-chat-panel" :class="{ 'r-chat-panel--sidebar-collapsed': sidebarCollapsedLocal }">
    <NButton
      quaternary
      circle
      size="small"
      class="r-chat-panel__hamburger"
      :aria-label="sidebarCollapsedLocal ? '展开侧边栏' : '折叠侧边栏'"
      @click="toggleSidebar"
    >
      <template #icon>
        <PanelLeftClose v-if="sidebarCollapsedLocal" :size="18" />
        <PanelLeft v-else :size="18" />
      </template>
    </NButton>
    <div class="r-chat-panel__sidebar">
      <slot name="sidebar" />
    </div>
    <div
      v-if="!sidebarCollapsedLocal"
      class="r-chat-panel__backdrop"
      role="button"
      tabindex="-1"
      aria-label="关闭侧边栏"
      @click="sidebarCollapsedLocal = true"
    />
    <div class="r-chat-panel__main">
      <slot name="header" />
      <div class="r-chat-panel__messages">
        <slot name="messages" />
      </div>
      <div class="r-chat-panel__input">
        <slot name="input" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-chat-panel {
  display: flex;
  gap: var(--ra-spacing-3, 12px);
  height: 100%;
  overflow: hidden;
  padding: var(--ra-spacing-3, 12px);
}
.r-chat-panel__sidebar {
  width: var(--ra-chat-sidebar-width, 280px);
  min-width: var(--ra-chat-sidebar-width, 280px);
  background: var(--ra-color-bg-surface, #fff);
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: var(--ra-radius-lg, 12px);
  box-shadow: var(--ra-shadow-card, 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03));
  overflow-y: auto;
}
.r-chat-panel__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ra-color-bg-surface, #fff);
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: var(--ra-radius-lg, 12px);
  box-shadow: var(--ra-shadow-card, 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03));
}
.r-chat-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--ra-spacing-4, 16px);
}
.r-chat-panel__input {
  padding: var(--ra-spacing-3, 12px) var(--ra-spacing-4, 16px);
  border-top: 1px solid var(--ra-chat-border-color);
}
.r-chat-panel__hamburger {
  flex-shrink: 0;
  align-self: flex-start;
}
.r-chat-panel__backdrop {
  display: none;
}
@media (max-width: 768px) {
  .r-chat-panel__hamburger {
    position: fixed;
    left: var(--ra-spacing-3, 12px);
    top: var(--ra-spacing-3, 12px);
    z-index: 1001;
  }
  .r-chat-panel__sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--ra-chat-sidebar-width, 280px);
    min-width: unset;
    z-index: 1000;
    transition: transform 0.25s ease;
  }
  .r-chat-panel--sidebar-collapsed .r-chat-panel__sidebar {
    transform: translateX(-100%);
  }
  .r-chat-panel__backdrop {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: var(--ra-chat-sidebar-width, 280px);
    background: rgba(0, 0, 0, 0.3);
    z-index: 999;
    cursor: pointer;
  }
}
@media (min-width: 769px) {
  .r-chat-panel__backdrop {
    display: none !important;
  }
  .r-chat-panel--sidebar-collapsed .r-chat-panel__sidebar {
    width: 0;
    min-width: 0;
    overflow: hidden;
    padding: 0;
    border: none;
    box-shadow: none;
  }
}
</style>
