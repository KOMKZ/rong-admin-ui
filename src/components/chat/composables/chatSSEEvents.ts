import type { SSEChunk } from '../types'
import { isToolInvocationEvent } from '../types'
import type { ChatSSEState } from './chatSSEState'

export function handleAgentEvent(
  state: ChatSSEState,
  eventName: string,
  payload: Record<string, unknown>,
  onToken: (chunk: SSEChunk) => void,
) {
  if (eventName === 'heartbeat') return
  if (eventName === 'agent_start') {
    state.agentProgress.value = {
      status: 'running',
      agentId: payload.agent_id as number | undefined,
      agentName: payload.agent_name as string | undefined,
      agentAvatar: payload.agent_avatar as string | undefined,
      totalNodes: payload.total_nodes as number | undefined,
      currentStep: 0,
    }
  } else if (eventName === 'agent_finish') {
    state.agentProgress.value = { ...state.agentProgress.value, status: 'done' }
  } else if (eventName === 'llm_token') {
    appendAgentToken(state, payload, onToken)
  } else if (eventName === 'node_enter') {
    updateAgentStep(state, payload)
  }
}

export function handleSSEChunk(state: ChatSSEState, chunk: SSEChunk) {
  const evtType = chunk.event_type
  if (evtType === 'search_start') handleSearchStart(state, chunk)
  else if (evtType === 'search_done') handleSearchDone(state, chunk)
  else if (evtType === 'fetch_start') handleFetchStart(state, chunk)
  else if (evtType === 'fetch_done') handleFetchDone(state, chunk)
  else if (evtType === 'mcp_tool_start') handleMCPStart(state, chunk)
  else if (evtType === 'mcp_tool_done') handleMCPDone(state, chunk)
  else if (evtType === 'fetch_fallback') handleFetchFallback(state, chunk)
  else if (evtType === 'tool_call') handleToolCall(state, chunk)
  else if (evtType === 'tool_result') handleToolResult(state, chunk)
  else if (chunk.type === 'usage' || evtType === 'usage') handleUsage(state, chunk)
  else if (chunk.type === 'error' || evtType === 'error') handleContextError(state, chunk)
  else handleContentChunk(state, chunk)
}

function appendAgentToken(
  state: ChatSSEState,
  payload: Record<string, unknown>,
  onToken: (chunk: SSEChunk) => void,
) {
  const token = payload.token as string | undefined
  if (!token) return
  state.streamContent.value += token
  onToken({ content: token } as SSEChunk)
}

function updateAgentStep(state: ChatSSEState, payload: Record<string, unknown>) {
  const step = (payload.current_step ?? payload.step_index) as number | undefined
  const total = payload.total_nodes as number | undefined
  if (step === undefined && total === undefined) return
  state.agentProgress.value = {
    ...state.agentProgress.value,
    currentStep: step ?? state.agentProgress.value.currentStep,
    totalNodes: total ?? state.agentProgress.value.totalNodes,
  }
}

function handleSearchStart(state: ChatSSEState, chunk: SSEChunk) {
  state.searchProgress.value = { status: 'searching', query: chunk.query }
  state.streamToolCallName.value = 'web_search'
}

function handleSearchDone(state: ChatSSEState, chunk: SSEChunk) {
  state.searchProgress.value = {
    status: 'done',
    query: chunk.query,
    resultCount: chunk.result_count,
    provider: chunk.provider,
  }
}

function handleFetchStart(state: ChatSSEState, chunk: SSEChunk) {
  state.fetchProgress.value = { status: 'fetching', domain: chunk.domain }
  state.streamToolCallName.value = 'web_fetch'
}

function handleFetchDone(state: ChatSSEState, chunk: SSEChunk) {
  state.fetchProgress.value = {
    status: 'done',
    domain: chunk.domain ?? (chunk.url ? extractDomain(chunk.url) : undefined),
    statusCode: chunk.status_code,
    latencyMs: chunk.latency_ms,
    fetchMethod: chunk.fetch_method ?? 'http',
  }
}

function handleMCPStart(state: ChatSSEState, chunk: SSEChunk) {
  state.mcpProgress.value = {
    status: 'calling',
    serverName: chunk.server_name,
    toolName: chunk.tool_name,
  }
  state.streamToolCallName.value = chunk.tool_name ?? chunk.server_name ?? 'mcp'
}

function handleMCPDone(state: ChatSSEState, chunk: SSEChunk) {
  state.mcpProgress.value = {
    status: 'done',
    serverName: chunk.server_name,
    toolName: chunk.tool_name,
  }
  state.streamToolCallName.value = ''
}

function handleFetchFallback(state: ChatSSEState, chunk: SSEChunk) {
  state.toolCallEvents.value = [
    ...state.toolCallEvents.value,
    { type: 'fetch_fallback', url: chunk.url ?? '', reason: chunk.reason ?? '' },
  ]
  state.streamToolCallName.value = 'web_fetch'
}

function handleToolCall(state: ChatSSEState, chunk: SSEChunk) {
  const name = chunk.tool_name ?? ''
  if (!name) return
  state.streamToolCallName.value = name
  state.toolCallEvents.value = [
    ...state.toolCallEvents.value,
    { name, args: chunk.tool_args },
  ]
}

function handleToolResult(state: ChatSSEState, chunk: SSEChunk) {
  const name = chunk.tool_name ?? ''
  const idx = [...state.toolCallEvents.value]
    .reverse()
    .findIndex((e) => isToolInvocationEvent(e) && e.name === name && !e.result)
  if (idx >= 0) updateToolResult(state, chunk, idx)
  state.streamToolCallName.value = ''
}

function updateToolResult(state: ChatSSEState, chunk: SSEChunk, reverseIndex: number) {
  const realIdx = state.toolCallEvents.value.length - 1 - reverseIndex
  const updated = [...state.toolCallEvents.value]
  updated[realIdx] = {
    ...updated[realIdx],
    result: chunk.tool_summary,
    latencyMs: chunk.latency_ms,
  }
  state.toolCallEvents.value = updated
}

function handleUsage(state: ChatSSEState, chunk: SSEChunk) {
  state.tokenUsage.value = {
    inputTokens: chunk.input_tokens ?? 0,
    outputTokens: chunk.output_tokens ?? 0,
    totalTokens: chunk.total_tokens ?? 0,
    inputCost: chunk.input_cost,
    outputCost: chunk.output_cost,
    totalCost: chunk.total_cost,
  }
}

function handleContextError(state: ChatSSEState, chunk: SSEChunk) {
  state.contextError.value = {
    type: 'error',
    code: chunk.code ?? 'provider_error',
    message: chunk.message ?? 'Unknown error',
  }
}

function handleContentChunk(state: ChatSSEState, chunk: SSEChunk) {
  const content = chunk.content ?? ''
  state.streamContent.value += content
  const tcs = (
    chunk as { tool_calls?: Array<{ function?: { name?: string }; name?: string }> }
  ).tool_calls
  if (tcs && tcs.length > 0) {
    const name = tcs[0]?.function?.name ?? tcs[0]?.name ?? ''
    if (name) state.streamToolCallName.value = name
  } else if (content) {
    state.streamToolCallName.value = ''
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
