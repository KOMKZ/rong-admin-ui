<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import type { ChatMessage } from './types'
import { NSpin, NButton } from 'naive-ui'

interface Props {
  messages: ChatMessage[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })
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
      <template v-for="msg in messages" :key="msg.id">
        <slot :message="msg" />
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
.r-chat-message-list__scroll-btn {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
