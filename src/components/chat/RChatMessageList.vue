<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import type { ChatMessage } from './types'
import { NSpin, NButton } from 'naive-ui'

interface Props {
  messages: ChatMessage[]
  loading?: boolean
}

interface ListItem {
  type: 'message' | 'date-separator'
  message?: ChatMessage
  dateLabel?: string
}

const props = withDefaults(defineProps<Props>(), { loading: false })

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dDay.getTime() === today.getTime()) return '今天'
  if (dDay.getTime() === yesterday.getTime()) return '昨天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function toDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const listItems = computed<ListItem[]>(() => {
  const items: ListItem[] = []
  let lastDateKey = ''
  for (const msg of props.messages) {
    const key = toDateKey(msg.created_at)
    if (key !== lastDateKey) {
      lastDateKey = key
      items.push({ type: 'date-separator', dateLabel: formatDateLabel(msg.created_at) })
    }
    items.push({ type: 'message', message: msg })
  }
  return items
})
const listRef = ref<HTMLDivElement>()
const userScrolledUp = ref(false)
const showScrollToBottomBtn = ref(false)
const BOTTOM_THRESHOLD = 80

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
      userScrolledUp.value = false
      showScrollToBottomBtn.value = false
    }
  })
}

function checkNearBottom() {
  const el = listRef.value
  if (!el) return true
  const near = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
  return near
}

function onScroll() {
  userScrolledUp.value = !checkNearBottom()
  if (userScrolledUp.value && checkHasNewBelow()) {
    showScrollToBottomBtn.value = true
  } else if (checkNearBottom()) {
    showScrollToBottomBtn.value = false
  }
}

function checkHasNewBelow() {
  const el = listRef.value
  if (!el) return false
  return el.scrollHeight - el.scrollTop - el.clientHeight > BOTTOM_THRESHOLD
}

watch(
  () => props.messages.length,
  (_, oldLen) => {
    const added = (props.messages.length || 0) > (oldLen || 0)
    if (added && checkNearBottom()) {
      scrollToBottom()
    } else if (added) {
      showScrollToBottomBtn.value = true
    }
  },
)

onMounted(() => {
  listRef.value?.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  listRef.value?.removeEventListener('scroll', onScroll)
})
defineExpose({ scrollToBottom })
</script>

<template>
  <div class="r-chat-message-list-wrapper">
    <div ref="listRef" class="r-chat-message-list" role="log" aria-live="polite">
    <NSpin v-if="loading" class="r-chat-message-list__loading" />
    <template v-else>
      <template v-for="(item, idx) in listItems" :key="item.type === 'date-separator' ? `date-${idx}` : `msg-${item.message!.id}`">
        <div v-if="item.type === 'date-separator'" class="r-chat-message-list__date-sep">{{ item.dateLabel }}</div>
        <slot v-else :message="item.message" />
      </template>
      <slot name="streaming" />
    </template>
    </div>
    <NButton
      v-if="showScrollToBottomBtn"
      size="small"
      class="r-chat-message-list__scroll-btn"
      @click="scrollToBottom"
    >
      ↓ 新消息
    </NButton>
  </div>
</template>

<style scoped>
.r-chat-message-list-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.r-chat-message-list {
  display: flex;
  flex-direction: column;
  gap: var(--ra-chat-message-gap, 16px);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.r-chat-message-list__loading {
  margin: auto;
}
.r-chat-message-list__date-sep {
  font-size: 12px;
  font-weight: 600;
  color: var(--ra-color-text-3, #999);
  padding: 8px 0 4px;
  flex-shrink: 0;
}
.r-chat-message-list__scroll-btn {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
