import { ref, onUnmounted } from 'vue'
import type { SSEChunk, ChatSSEOptions, SearchProgress, ToolCallEvent } from '../types'

const MAX_RETRIES = 3
const HEARTBEAT_INTERVAL_MS = 30_000

export function useChatSSE() {
  const isStreaming = ref(false)
  const streamContent = ref('')
  const streamToolCallName = ref('')
  const error = ref<Error | null>(null)
  const searchProgress = ref<SearchProgress>({ status: 'idle' })
  const toolCallEvents = ref<ToolCallEvent[]>([])
  let abortController: AbortController | null = null
  let userStoppedRef = false

  async function startStream(options: ChatSSEOptions) {
    isStreaming.value = true
    streamContent.value = ''
    streamToolCallName.value = ''
    searchProgress.value = { status: 'idle' }
    toolCallEvents.value = []
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
            for (;;) {
              const { done, value } = await reader.read()
              if (done) break

              resetHeartbeat()
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim()
                  if (data === '[DONE]') {
                    if (heartbeatTimer) clearTimeout(heartbeatTimer)
                    options.onDone()
                    return
                  }
                  try {
                    const chunk: SSEChunk = JSON.parse(data)
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
                    } else if (evtType === 'tool_call') {
                      const name = chunk.tool_name ?? ''
                      if (name) {
                        streamToolCallName.value = name
                        toolCallEvents.value = [...toolCallEvents.value, { name, args: chunk.tool_args }]
                      }
                    } else if (evtType === 'tool_result') {
                      const name = chunk.tool_name ?? ''
                      const idx = [...toolCallEvents.value].reverse().findIndex((e) => e.name === name && !e.result)
                      if (idx >= 0) {
                        const realIdx = toolCallEvents.value.length - 1 - idx
                        const updated = [...toolCallEvents.value]
                        updated[realIdx] = { ...updated[realIdx], result: chunk.tool_summary, latencyMs: chunk.latency_ms }
                        toolCallEvents.value = updated
                      }
                      streamToolCallName.value = ''
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
                }
              }
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
    toolCallEvents,
    error,
    startStream,
    stopStream,
  }
}
