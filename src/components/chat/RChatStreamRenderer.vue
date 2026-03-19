<script setup lang="ts">
import RChatMarkdownRenderer from './RChatMarkdownRenderer.vue'

interface Props {
  content: string
  streaming?: boolean
}

withDefaults(defineProps<Props>(), { streaming: false })
</script>

<template>
  <div class="r-chat-stream-renderer">
    <RChatMarkdownRenderer v-if="content" :content="content" />
    <span v-if="streaming" class="r-chat-stream-renderer__cursor">▌</span>
  </div>
</template>

<style scoped>
.r-chat-stream-renderer {
  display: inline;
  line-height: 1.6;
  word-break: break-word;
}
.r-chat-stream-renderer__cursor {
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
