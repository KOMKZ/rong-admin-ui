<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { ChatMessage } from './types'
import { NSpin } from 'naive-ui'

interface Props {
  messages: ChatMessage[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const listRef = ref<HTMLDivElement>()

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

watch(() => props.messages.length, scrollToBottom)
defineExpose({ scrollToBottom })
</script>

<template>
  <div ref="listRef" class="r-chat-message-list">
    <NSpin v-if="loading" class="r-chat-message-list__loading" />
    <template v-else>
      <template v-for="msg in messages" :key="msg.id">
        <slot :message="msg" />
      </template>
      <slot name="streaming" />
    </template>
  </div>
</template>

<style scoped>
.r-chat-message-list {
  display: flex;
  flex-direction: column;
  gap: var(--ra-chat-message-gap, 16px);
  overflow-y: auto;
  height: 100%;
}
.r-chat-message-list__loading {
  margin: auto;
}
</style>
