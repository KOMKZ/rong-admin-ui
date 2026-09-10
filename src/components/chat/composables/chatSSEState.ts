import { ref, type Ref } from 'vue'
import type {
  AgentProgress,
  FetchProgress,
  MCPProgress,
  SearchProgress,
  SSEError,
  TokenUsage,
  ToolCallEvent,
} from '../types'

export interface ChatSSEState {
  isStreaming: Ref<boolean>
  streamContent: Ref<string>
  streamToolCallName: Ref<string>
  error: Ref<Error | null>
  searchProgress: Ref<SearchProgress>
  fetchProgress: Ref<FetchProgress>
  mcpProgress: Ref<MCPProgress>
  agentProgress: Ref<AgentProgress>
  toolCallEvents: Ref<ToolCallEvent[]>
  tokenUsage: Ref<TokenUsage | null>
  contextError: Ref<SSEError | null>
}

export interface ChatSSEControl {
  abortController: AbortController | null
  userStopped: boolean
}

export function createChatSSEState(): ChatSSEState {
  return {
    isStreaming: ref(false),
    streamContent: ref(''),
    streamToolCallName: ref(''),
    error: ref<Error | null>(null),
    searchProgress: ref<SearchProgress>({ status: 'idle' }),
    fetchProgress: ref<FetchProgress>({ status: 'idle' }),
    mcpProgress: ref<MCPProgress>({ status: 'idle' }),
    agentProgress: ref<AgentProgress>({ status: 'idle' }),
    toolCallEvents: ref<ToolCallEvent[]>([]),
    tokenUsage: ref<TokenUsage | null>(null),
    contextError: ref<SSEError | null>(null),
  }
}

export function resetChatSSEState(state: ChatSSEState) {
  state.isStreaming.value = true
  state.streamContent.value = ''
  state.streamToolCallName.value = ''
  state.searchProgress.value = { status: 'idle' }
  state.fetchProgress.value = { status: 'idle' }
  state.mcpProgress.value = { status: 'idle' }
  state.agentProgress.value = { status: 'idle' }
  state.toolCallEvents.value = []
  state.tokenUsage.value = null
  state.contextError.value = null
  state.error.value = null
}
