<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NScrollbar, NEmpty, NDropdown, type DropdownOption } from 'naive-ui'
import { Trash2 } from 'lucide-vue-next'
import type { ChatConversation } from './types'

interface Props {
  conversations: ChatConversation[]
  activeId?: number
  loading?: boolean
}

interface Emits {
  (e: 'select', id: number): void
  (e: 'create'): void
  (e: 'delete', id: number): void
  (e: 'rename', id: number, title: string): void
  (e: 'archive', id: number): void
  (e: 'pin', id: number): void
  (e: 'unpin', id: number): void
  (e: 'search', keyword: string): void
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const emit = defineEmits<Emits>()

const searchKeyword = ref('')
const searchDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function emitSearch() {
  if (searchDebounceTimer.value) clearTimeout(searchDebounceTimer.value)
  searchDebounceTimer.value = setTimeout(() => {
    emit('search', searchKeyword.value.trim())
    searchDebounceTimer.value = null
  }, 300)
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚才'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24 && d.getDate() === now.getDate()) return `${diffHours}小时前`
  if (diffDays === 1 || (diffDays < 2 && d.getDate() !== now.getDate())) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return d.toLocaleDateString()
}

function truncatePreview(text: string | undefined, maxLines = 2): string {
  if (!text || !text.trim()) return ''
  const lines = text.split(/\n/)
  const truncated = lines.slice(0, maxLines).join('\n')
  return lines.length > maxLines ? truncated + '...' : truncated
}

function getGroupKey(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dDay.getTime() >= today.getTime()) return 'today'
  if (dDay.getTime() >= yesterday.getTime()) return 'yesterday'
  if (dDay.getTime() >= sevenDaysAgo.getTime()) return 'within7days'
  return 'older'
}

const groupLabels: Record<string, string> = {
  today: '今天',
  yesterday: '昨天',
  within7days: '7天内',
  older: '更早',
}

const filteredConversations = computed(() => props.conversations)

const pinnedConversations = computed(() =>
  filteredConversations.value
    .filter((c) => c.pinned)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
)

const groupedConversations = computed(() => {
  const unpinned = filteredConversations.value.filter((c) => !c.pinned)
  const groups: { key: string; label: string; items: ChatConversation[] }[] = []
  const order = ['today', 'yesterday', 'within7days', 'older']
  const map = new Map<string, ChatConversation[]>()

  for (const conv of unpinned) {
    const key = getGroupKey(conv.updated_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(conv)
  }

  for (const key of order) {
    const items = map.get(key)
    if (items?.length) {
      items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      groups.push({ key, label: groupLabels[key], items })
    }
  }
  return groups
})

function getDropdownOptions(conv: ChatConversation): DropdownOption[] {
  const opts: DropdownOption[] = [
    { label: conv.pinned ? '取消置顶' : '置顶', key: conv.pinned ? 'unpin' : 'pin' },
    { label: '重命名', key: 'rename' },
    { label: '归档', key: 'archive' },
    { type: 'divider', key: 'd1' },
    { label: '删除', key: 'delete' },
  ]
  return opts
}

function handleDropdownSelect(key: string, conv: ChatConversation) {
  if (key === 'rename') {
    const title = window.prompt('输入新标题', conv.title || '未命名对话')
    if (title != null) emit('rename', conv.id, title.trim() || conv.title || '未命名对话')
  } else if (key === 'archive') {
    emit('archive', conv.id)
  } else if (key === 'pin') {
    emit('pin', conv.id)
  } else if (key === 'unpin') {
    emit('unpin', conv.id)
  } else if (key === 'delete') {
    emit('delete', conv.id)
  }
}

function handleDeleteClick(e: Event, id: number) {
  e.stopPropagation()
  emit('delete', id)
}
</script>

<template>
  <div class="r-chat-conv-list">
    <div class="r-chat-conv-list__header">
      <NButton type="primary" block aria-label="新建对话" @click="$emit('create')">新建对话</NButton>
      <NInput
        v-model:value="searchKeyword"
        placeholder="搜索对话..."
        clearable
        size="small"
        role="searchbox"
        aria-label="搜索对话"
        @update:value="emitSearch"
      />
    </div>
    <NScrollbar class="r-chat-conv-list__body">
      <NEmpty v-if="!conversations.length" description="暂无对话" />
      <template v-else>
        <template v-if="pinnedConversations.length">
          <div class="r-chat-conv-list__group-title">置顶</div>
          <NDropdown
            v-for="conv in pinnedConversations"
            :key="'pinned-' + conv.id"
            :trigger="('contextmenu' as any)"
            :options="getDropdownOptions(conv)"
            @select="(key: string) => handleDropdownSelect(key, conv)"
          >
            <div
              class="r-chat-conv-list__item"
              :class="{ 'r-chat-conv-list__item--active': conv.id === activeId }"
              role="button"
              tabindex="0"
              :aria-label="`对话: ${conv.title || '未命名对话'}`"
              @click="$emit('select', conv.id)"
              @keydown.enter="$emit('select', conv.id)"
              @keydown.space.prevent="$emit('select', conv.id)"
            >
              <div class="r-chat-conv-list__item-head">
                <div class="r-chat-conv-list__item-title">{{ conv.title || '未命名对话' }}</div>
                <span class="r-chat-conv-list__item-time">{{ formatRelativeTime(conv.updated_at) }}</span>
              </div>
              <div v-if="truncatePreview(conv.summary)" class="r-chat-conv-list__item-preview">
                {{ truncatePreview(conv.summary) }}
              </div>
              <div class="r-chat-conv-list__item-meta">
                {{ conv.message_count }} 条消息 · {{ conv.model }}
              </div>
              <NButton
                quaternary
                circle
                size="tiny"
                class="r-chat-conv-list__item-delete"
                aria-label="删除对话"
                @click="handleDeleteClick($event, conv.id)"
              >
                <template #icon>
                  <Trash2 :size="14" />
                </template>
              </NButton>
            </div>
          </NDropdown>
        </template>
        <template v-for="group in groupedConversations" :key="group.key">
          <div class="r-chat-conv-list__group-title">{{ group.label }}</div>
          <NDropdown
            v-for="conv in group.items"
            :key="conv.id"
            :trigger="('contextmenu' as any)"
            :options="getDropdownOptions(conv)"
            @select="(key: string) => handleDropdownSelect(key, conv)"
          >
            <div
              class="r-chat-conv-list__item"
              :class="{ 'r-chat-conv-list__item--active': conv.id === activeId }"
              role="button"
              tabindex="0"
              :aria-label="`对话: ${conv.title || '未命名对话'}`"
              @click="$emit('select', conv.id)"
              @keydown.enter="$emit('select', conv.id)"
              @keydown.space.prevent="$emit('select', conv.id)"
            >
              <div class="r-chat-conv-list__item-head">
                <div class="r-chat-conv-list__item-title">{{ conv.title || '未命名对话' }}</div>
                <span class="r-chat-conv-list__item-time">{{ formatRelativeTime(conv.updated_at) }}</span>
              </div>
              <div v-if="truncatePreview(conv.summary)" class="r-chat-conv-list__item-preview">
                {{ truncatePreview(conv.summary) }}
              </div>
              <div class="r-chat-conv-list__item-meta">
                {{ conv.message_count }} 条消息 · {{ conv.model }}
              </div>
              <NButton
                quaternary
                circle
                size="tiny"
                class="r-chat-conv-list__item-delete"
                aria-label="删除对话"
                @click="handleDeleteClick($event, conv.id)"
              >
                <template #icon>
                  <Trash2 :size="14" />
                </template>
              </NButton>
            </div>
          </NDropdown>
        </template>
      </template>
    </NScrollbar>
  </div>
</template>

<style scoped>
.r-chat-conv-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.r-chat-conv-list__header {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.r-chat-conv-list__body {
  flex: 1;
  padding: 0 8px;
}
.r-chat-conv-list__group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ra-color-text-3, #999);
  padding: 8px 12px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.r-chat-conv-list__item {
  position: relative;
  padding: 10px 12px 10px 12px;
  padding-right: 36px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}
.r-chat-conv-list__item:hover {
  background: var(--ra-chat-sidebar-hover-bg);
}
.r-chat-conv-list__item:hover .r-chat-conv-list__item-delete {
  opacity: 1;
}
.r-chat-conv-list__item--active {
  background: var(--ra-chat-sidebar-active-bg);
}
.r-chat-conv-list__item-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.r-chat-conv-list__item-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.r-chat-conv-list__item-time {
  font-size: 11px;
  opacity: 0.6;
  flex-shrink: 0;
}
.r-chat-conv-list__item-preview {
  font-size: 12px;
  opacity: 0.75;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.r-chat-conv-list__item-meta {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 4px;
}
.r-chat-conv-list__item-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}
.r-chat-conv-list__item-delete:hover {
  opacity: 1;
}
</style>
