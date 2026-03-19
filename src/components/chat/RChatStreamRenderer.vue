<script setup lang="ts">
interface Props {
  content: string
  streaming?: boolean
}

withDefaults(defineProps<Props>(), { streaming: false })
</script>

<template>
  <div class="r-chat-stream-renderer">
    <div class="r-chat-stream-renderer__content" v-text="content" />
    <span v-if="streaming" class="r-chat-stream-renderer__cursor">▌</span>
  </div>
</template>

<style scoped>
.r-chat-stream-renderer {
  display: inline;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}
.r-chat-stream-renderer__cursor {
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
