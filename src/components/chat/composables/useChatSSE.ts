import { ref, onUnmounted } from 'vue'
import {
  type SSEChunk,
  type ChatSSEOptions,
  type SearchProgress,
  type FetchProgress,
  type MCPProgress,
  type AgentProgress,
  type ToolCallEvent,
  type TokenUsage,
  type SSEError,
  isToolInvocationEvent,
} from '../types'

const MAX_RETRIES = 3
const HEARTBEAT_INTERVAL_MS = 120_000

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function useChatSSE() {
  const isStreaming = ref(false)
  const streamContent = ref('')
  const streamToolCallName = ref('')
  const error = ref<Error | null>(null)
  const searchProgress = ref<SearchProgress>({ status: 'idle' })
  const fetchProgress = ref<FetchProgress>({ status: 'idle' })
  const mcpProgress = ref<MCPProgress>({ status: 'idle' })
  const agentProgress = ref<AgentProgress>({ status: 'idle' })
  const toolCallEvents = ref<ToolCallEvent[]>([])
  const tokenUsage = ref<TokenUsage | null>(null)
  const contextError = ref<SSEError | null>(null)
  let abortController: AbortController | null = null
  let userStoppedRef = false

  async function startStream(options: ChatSSEOptions) {
    isStreaming.value = true
    streamContent.value = ''
    streamToolCallName.value = ''
    searchProgress.value = { status: 'idle' }
    fetchProgress.value = { status: 'idle' }
    mcpProgress.value = { status: 'idle' }
    agentProgress.value = { status: 'idle' }
    toolCallEvents.value = []
    tokenUsage.value = null
    contextError.value = null
    error.value = null
    userStoppedRef = false
    abortController = new AbortController()

    let lastError: Error | null = null
    let attemptsLeft = MAX_RETRIES

    try {
      while (attemptsLeft > 0) {
        if (userStoppedRef) break
        try {
          const response = await fetch(options.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
            body: JSON.stringify(options.body),
            signal: abortController!.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) throw new Error('No response body')

          const decoder = new TextDecoder()
          let buffer = ''
          let heartbeatTimer: ReturnType<typeof setTimeout> | null = null

          const resetHeartbeat = () => {
            if (heartbeatTimer) clearTimeout(heartbeatTimer)
            heartbeatTimer = setTimeout(() => {
              if (!userStoppedRef && abortController) {
                abortController.abort()
              }
            }, HEARTBEAT_INTERVAL_MS)
          }

          resetHeartbeat()

          try {
            let pendingEventName: string | undefined

            function handleAgentEvent(eventName: string, payload: Record<string, unknown>) {
              if (eventName === 'heartbeat') {
                return
              } else if (eventName === 'agent_start') {
                agentProgress.value = {
                  status: 'running',
                  agentId: payload.agent_id as number | undefined,
                  agentName: payload.agent_name as string | undefined,
                  agentAvatar: payload.agent_avatar as string | undefined,
                  totalNodes: payload.total_nodes as number | undefined,
                  currentStep: 0,
                }
              } else if (eventName === 'agent_finish') {
                agentProgress.value = { ...agentProgress.value, status: 'done' }
              } else if (eventName === 'llm_token') {
                const token = payload.token as string | undefined
                if (token) {
                  streamContent.value += token
                  options.onChunk({ content: token } as SSEChunk)
                }
              } else if (eventName === 'node_enter') {
                const step = (payload.current_step ?? payload.step_index) as number | undefined
                const total = payload.total_nodes as number | undefined
                if (step !== undefined || total !== undefined) {
                  agentProgress.value = {
                    ...agentProgress.value,
                    currentStep: step ?? agentProgress.value.currentStep,
                    totalNodes: total ?? agentProgress.value.totalNodes,
                  }
                }
              }
            }

            function processDataLine(data: string) {
              if (data === '[DONE]') {
                if (heartbeatTimer) clearTimeout(heartbeatTimer)
                options.onDone()
                return true
              }
              try {
                const chunk: SSEChunk = JSON.parse(data)

                if (pendingEventName) {
                  handleAgentEvent(pendingEventName, chunk as unknown as Record<string, unknown>)
                  pendingEventName = undefined
                  return false
                }

                const evtType = chunk.event_type

                if (evtType === 'search_start') {
                  searchProgress.value = { status: 'searching', query: chunk.query }
                  streamToolCallName.value = 'web_search'
                } else if (evtType === 'search_done') {
                  searchProgress.value = {
                    status: 'done',
                    query: chunk.query,
                    resultCount: chunk.result_count,
                    provider: chunk.provider,
                  }
                } else if (evtType === 'fetch_start') {
                  fetchProgress.value = { status: 'fetching', domain: chunk.domain }
                  streamToolCallName.value = 'web_fetch'
                } else if (evtType === 'fetch_done') {
                  const domain = chunk.domain ?? (chunk.url ? extractDomain(chunk.url) : undefined)
                  fetchProgress.value = {
                    status: 'done',
                    domain,
                    statusCode: chunk.status_code,
                    latencyMs: chunk.latency_ms,
                    fetchMethod: chunk.fetch_method ?? 'http',
                  }
                } else if (evtType === 'mcp_tool_start') {
                  mcpProgress.value = {
                    status: 'calling',
                    serverName: chunk.server_name,
                    toolName: chunk.tool_name,
                  }
                  streamToolCallName.value = chunk.tool_name ?? chunk.server_name ?? 'mcp'
                } else if (evtType === 'mcp_tool_done') {
                  mcpProgress.value = {
                    status: 'done',
                    serverName: chunk.server_name,
                    toolName: chunk.tool_name,
                  }
                  streamToolCallName.value = ''
                } else if (evtType === 'fetch_fallback') {
                  toolCallEvents.value = [
                    ...toolCallEvents.value,
                    {
                      type: 'fetch_fallback',
                      url: chunk.url ?? '',
                      reason: chunk.reason ?? '',
                    },
                  ]
                  streamToolCallName.value = 'web_fetch'
                } else if (evtType === 'tool_call') {
                  const name = chunk.tool_name ?? ''
                  if (name) {
                    streamToolCallName.value = name
                    toolCallEvents.value = [...toolCallEvents.value, { name, args: chunk.tool_args }]
                  }
                } else if (evtType === 'tool_result') {
                  const name = chunk.tool_name ?? ''
                  const idx = [...toolCallEvents.value]
                    .reverse()
                    .findIndex((e) => isToolInvocationEvent(e) && e.name === name && !e.result)
                  if (idx >= 0) {
                    const realIdx = toolCallEvents.value.length - 1 - idx
                    const updated = [...toolCallEvents.value]
                    updated[realIdx] = { ...updated[realIdx], result: chunk.tool_summary, latencyMs: chunk.latency_ms }
                    toolCallEvents.value = updated
                  }
                  streamToolCallName.value = ''
                } else if (chunk.type === 'usage' || evtType === 'usage') {
                  tokenUsage.value = {
                    inputTokens: chunk.input_tokens ?? 0,
                    outputTokens: chunk.output_tokens ?? 0,
                    totalTokens: chunk.total_tokens ?? 0,
                    inputCost: chunk.input_cost,
                    outputCost: chunk.output_cost,
                    totalCost: chunk.total_cost,
                  }
                } else if (chunk.type === 'error' || evtType === 'error') {
                  contextError.value = {
                    type: 'error',
                    code: chunk.code ?? 'provider_error',
                    message: chunk.message ?? 'Unknown error',
                  }
                } else {
                  const content = chunk.content ?? ''
                  streamContent.value += content
                  const tcs = (chunk as { tool_calls?: Array<{ function?: { name?: string }; name?: string }> }).tool_calls
                  if (tcs && tcs.length > 0) {
                    const name = tcs[0]?.function?.name ?? tcs[0]?.name ?? ''
                    if (name) streamToolCallName.value = name
                  } else if (content) {
                    streamToolCallName.value = ''
                  }
                }

                options.onChunk(chunk)
              } catch {
                // skip non-JSON lines
              }
              return false
            }

            const DATA_EVENT_NAMES = new Set(['chunk', 'usage', 'error'])

            function processFrame(frame: string): boolean {
              const dataLines: string[] = []
              let frameEvent: string | undefined
              for (const raw of frame.split('\n')) {
                const line = raw.replace(/\r$/, '')
                if (line.startsWith('event:')) {
                  frameEvent = line.slice(line.indexOf(':') + 1).trim()
                } else if (line.startsWith('data:')) {
                  dataLines.push(line.slice(line.indexOf(':') + 1).trimStart())
                }
              }
              const payload = dataLines.join('\n')
              if (payload) {
                const effectiveEvent = frameEvent ?? pendingEventName
                if (effectiveEvent) pendingEventName = effectiveEvent
                if (pendingEventName && payload !== '[DONE]' && !DATA_EVENT_NAMES.has(pendingEventName)) {
                  try {
                    const parsed = JSON.parse(payload)
                    handleAgentEvent(pendingEventName, parsed)
                    pendingEventName = undefined
                    return false
                  } catch { /* fall through to processDataLine */ }
                }
                pendingEventName = undefined
                return processDataLine(payload)
              } else if (frameEvent) {
                pendingEventName = frameEvent
              }
              return false
            }

            for (;;) {
              const { done, value } = await reader.read()
              if (done) break

              resetHeartbeat()
              buffer += decoder.decode(value, { stream: true })

              let sep: number
              while ((sep = buffer.indexOf('\n\n')) !== -1) {
                const frame = buffer.slice(0, sep)
                buffer = buffer.slice(sep + 2)
                if (processFrame(frame)) return
              }
            }

            if (buffer.trim()) {
              processFrame(buffer)
            }

            if (heartbeatTimer) clearTimeout(heartbeatTimer)
            options.onDone()
            return
          } finally {
            if (heartbeatTimer) clearTimeout(heartbeatTimer)
          }
        } catch (e) {
          lastError = e as Error
          if ((e as Error).name === 'AbortError' && userStoppedRef) {
            break
          }
          attemptsLeft -= 1
          if (attemptsLeft > 0 && !userStoppedRef) {
            streamContent.value = ''
            abortController = new AbortController()
          }
        }
      }

      error.value = lastError
      if (lastError && !userStoppedRef) {
        options.onError(lastError)
      }
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function stopStream() {
    userStoppedRef = true
    abortController?.abort()
    isStreaming.value = false
  }

  onUnmounted(() => {
    stopStream()
  })

  return {
    isStreaming,
    streamContent,
    streamToolCallName,
    searchProgress,
    fetchProgress,
    mcpProgress,
    agentProgress,
    toolCallEvents,
    tokenUsage,
    contextError,
    error,
    startStream,
    stopStream,
  }
}
