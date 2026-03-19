<script setup lang="ts">
import { computed } from 'vue'
import RChatMarkdownRenderer from './RChatMarkdownRenderer.vue'

interface Props {
  content: string
  streaming?: boolean
  isThinking?: boolean
  /** CHATADV-013: Show "正在调用 xxx 工具..." when streaming receives tool_calls chunk. */
  toolCallName?: string
}

const props = withDefaults(defineProps<Props>(), { streaming: false, isThinking: false, toolCallName: '' })

const showThinking = computed(() => props.isThinking && !props.content)
const showToolCalling = computed(() => !!props.toolCallName && props.streaming)
const showContent = computed(() => !!props.content)
</script>

<template>
  <div class="r-chat-stream-renderer">
    <span v-if="showThinking" class="r-chat-stream-renderer__thinking">
      思考中<span class="r-chat-stream-renderer__dots">
        <span class="r-chat-stream-renderer__dot" />
        <span class="r-chat-stream-renderer__dot" />
        <span class="r-chat-stream-renderer__dot" />
      </span>
    </span>
    <span v-else-if="showToolCalling" class="r-chat-stream-renderer__tool-calling">
      正在调用 {{ toolCallName }} 工具<span class="r-chat-stream-renderer__dots">
        <span class="r-chat-stream-renderer__dot" />
        <span class="r-chat-stream-renderer__dot" />
        <span class="r-chat-stream-renderer__dot" />
      </span>
    </span>
    <template v-else>
      <RChatMarkdownRenderer v-if="showContent" :content="content" />
      <span v-if="streaming" class="r-chat-stream-renderer__cursor">▌</span>
    </template>
  </div>
</template>

<style scoped>
.r-chat-stream-renderer {
  display: inline;
  line-height: 1.6;
  word-break: break-word;
}
.r-chat-stream-renderer__thinking,
.r-chat-stream-renderer__tool-calling {
  color: var(--ra-color-text-tertiary, #6e7389);
}
.r-chat-stream-renderer__dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  margin: 0 1px;
  border-radius: 50%;
  background: currentColor;
  animation: bounce 0.6s ease-in-out infinite;
}
.r-chat-stream-renderer__dots {
  display: inline-block;
  margin-left: 2px;
}
.r-chat-stream-renderer__dots .r-chat-stream-renderer__dot:nth-child(2) {
  animation-delay: 0.15s;
}
.r-chat-stream-renderer__dots .r-chat-stream-renderer__dot:nth-child(3) {
  animation-delay: 0.3s;
}
.r-chat-stream-renderer__cursor {
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes bounce {
  0%, 100% { opacity: 0.4; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}
</style>
