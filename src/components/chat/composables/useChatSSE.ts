import { onUnmounted } from 'vue'
import type { ChatSSEOptions } from '../types'
import { createChatSSEState, type ChatSSEControl } from './chatSSEState'
import { startChatSSEStream } from './chatSSEStreamRunner'

export function useChatSSE() {
  const state = createChatSSEState()
  const control: ChatSSEControl = { abortController: null, userStopped: false }

  async function startStream(options: ChatSSEOptions) {
    await startChatSSEStream(state, control, options)
  }

  function stopStream() {
    control.userStopped = true
    control.abortController?.abort()
    state.isStreaming.value = false
  }

  onUnmounted(() => {
    stopStream()
  })

  return {
    isStreaming: state.isStreaming,
    streamContent: state.streamContent,
    streamToolCallName: state.streamToolCallName,
    searchProgress: state.searchProgress,
    fetchProgress: state.fetchProgress,
    mcpProgress: state.mcpProgress,
    agentProgress: state.agentProgress,
    toolCallEvents: state.toolCallEvents,
    tokenUsage: state.tokenUsage,
    contextError: state.contextError,
    error: state.error,
    startStream,
    stopStream,
  }
}
