<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { NInput, NButton, NScrollbar, NEmpty, NDropdown, type DropdownOption } from 'naive-ui'
import { Trash2, Star } from 'lucide-vue-next'
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
  (e: 'favorite', id: number): void
  (e: 'unfavorite', id: number): void
  (e: 'search', keyword: string): void
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const emit = defineEmits<Emits>()

const searchKeyword = ref('')
const editingConvId = ref<number | null>(null)
const editingTitle = ref('')
const editingInputRef = ref<{ focus: () => void } | null>(null)
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
    { label: conv.favorite ? '取消收藏' : '收藏', key: conv.favorite ? 'unfavorite' : 'favorite' },
    { label: '重命名', key: 'rename' },
    { label: '归档', key: 'archive' },
    { type: 'divider', key: 'd1' },
    { label: '删除', key: 'delete' },
  ]
  return opts
}

function startEditing(conv: ChatConversation) {
  editingConvId.value = conv.id
  editingTitle.value = conv.title || '未命名对话'
  nextTick(() => editingInputRef.value?.focus?.())
}

function saveEditing(conv: ChatConversation) {
  const title = editingTitle.value.trim() || conv.title || '未命名对话'
  emit('rename', conv.id, title)
  editingConvId.value = null
  editingTitle.value = ''
}

function cancelEditing() {
  editingConvId.value = null
  editingTitle.value = ''
}

function handleItemClick(conv: ChatConversation) {
  if (editingConvId.value === conv.id) return
  emit('select', conv.id)
}

function handleItemKeydown(e: KeyboardEvent, conv: ChatConversation) {
  if (editingConvId.value === conv.id) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('select', conv.id)
  }
}

function handleDropdownSelect(key: string, conv: ChatConversation) {
  if (key === 'rename') {
    startEditing(conv)
  } else if (key === 'archive') {
    emit('archive', conv.id)
  } else if (key === 'pin') {
    emit('pin', conv.id)
  } else if (key === 'unpin') {
    emit('unpin', conv.id)
  } else if (key === 'favorite') {
    emit('favorite', conv.id)
  } else if (key === 'unfavorite') {
    emit('unfavorite', conv.id)
  } else if (key === 'delete') {
    emit('delete', conv.id)
  }
}

function handleDeleteClick(e: Event, id: number) {
  e.stopPropagation()
  emit('delete', id)
}

function handleFavoriteClick(e: Event, conv: ChatConversation) {
  e.stopPropagation()
  if (conv.favorite) emit('unfavorite', conv.id)
  else emit('favorite', conv.id)
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
              @click="handleItemClick(conv)"
              @keydown="(e: KeyboardEvent) => handleItemKeydown(e, conv)"
            >
              <div class="r-chat-conv-list__item-head">
                <NInput
                  v-if="editingConvId === conv.id"
                  ref="editingInputRef"
                  v-model:value="editingTitle"
                  size="small"
                  placeholder="对话标题"
                  class="r-chat-conv-list__item-edit"
                  @click.stop
                  @keydown.enter.prevent="saveEditing(conv)"
                  @keydown.escape="cancelEditing()"
                />
                <div
                  v-else
                  class="r-chat-conv-list__item-title"
                  @dblclick.stop="startEditing(conv)"
                >
                  {{ conv.title || '未命名对话' }}
                </div>
                <div class="r-chat-conv-list__item-actions">
                  <NButton
                    quaternary
                    circle
                    size="tiny"
                    :class="['r-chat-conv-list__item-favorite', { 'r-chat-conv-list__item-favorite--active': conv.favorite }]"
                    :aria-label="conv.favorite ? '取消收藏' : '收藏'"
                    @click="handleFavoriteClick($event, conv)"
                  >
                    <template #icon>
                      <Star :size="14" :fill="conv.favorite ? 'currentColor' : 'none'" />
                    </template>
                  </NButton>
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
              </div>
              <div class="r-chat-conv-list__item-sub">
                <span class="r-chat-conv-list__item-time">{{ formatRelativeTime(conv.updated_at) }}</span>
                <span class="r-chat-conv-list__item-meta">{{ conv.message_count }} 条 · {{ conv.model }}</span>
              </div>
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
              @click="handleItemClick(conv)"
              @keydown="(e: KeyboardEvent) => handleItemKeydown(e, conv)"
            >
              <div class="r-chat-conv-list__item-head">
                <NInput
                  v-if="editingConvId === conv.id"
                  ref="editingInputRef"
                  v-model:value="editingTitle"
                  size="small"
                  placeholder="对话标题"
                  class="r-chat-conv-list__item-edit"
                  @click.stop
                  @keydown.enter.prevent="saveEditing(conv)"
                  @keydown.escape="cancelEditing()"
                />
                <div
                  v-else
                  class="r-chat-conv-list__item-title"
                  @dblclick.stop="startEditing(conv)"
                >
                  {{ conv.title || '未命名对话' }}
                </div>
                <div class="r-chat-conv-list__item-actions">
                  <NButton
                    quaternary
                    circle
                    size="tiny"
                    :class="['r-chat-conv-list__item-favorite', { 'r-chat-conv-list__item-favorite--active': conv.favorite }]"
                    :aria-label="conv.favorite ? '取消收藏' : '收藏'"
                    @click="handleFavoriteClick($event, conv)"
                  >
                    <template #icon>
                      <Star :size="14" :fill="conv.favorite ? 'currentColor' : 'none'" />
                    </template>
                  </NButton>
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
              </div>
              <div class="r-chat-conv-list__item-sub">
                <span class="r-chat-conv-list__item-time">{{ formatRelativeTime(conv.updated_at) }}</span>
                <span class="r-chat-conv-list__item-meta">{{ conv.message_count }} 条 · {{ conv.model }}</span>
              </div>
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
  font-size: 11px;
  font-weight: 600;
  color: var(--ra-color-text-3, #999);
  padding: 12px 12px 4px;
  letter-spacing: 0.3px;
}
.r-chat-conv-list__item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.15s;
}
.r-chat-conv-list__item:hover {
  background: var(--ra-chat-sidebar-hover-bg);
}
.r-chat-conv-list__item--active {
  background: var(--ra-chat-sidebar-active-bg);
}
.r-chat-conv-list__item-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.r-chat-conv-list__item-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}
.r-chat-conv-list__item-edit {
  flex: 1;
  min-width: 0;
}
.r-chat-conv-list__item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.r-chat-conv-list__item:hover .r-chat-conv-list__item-actions {
  opacity: 1;
}
.r-chat-conv-list__item-favorite--active {
  opacity: 1 !important;
  color: var(--ra-color-warning, #f0a020);
}
.r-chat-conv-list__item-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.15s, max-height 0.15s;
}
.r-chat-conv-list__item:hover .r-chat-conv-list__item-sub,
.r-chat-conv-list__item--active .r-chat-conv-list__item-sub {
  opacity: 1;
  max-height: 20px;
}
.r-chat-conv-list__item-time {
  font-size: 11px;
  color: var(--ra-color-text-3, #999);
}
.r-chat-conv-list__item-meta {
  font-size: 11px;
  color: var(--ra-color-text-3, #999);
}
</style>
