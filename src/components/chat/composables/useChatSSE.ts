import { ref, onUnmounted } from 'vue'
import type { SSEChunk, ChatSSEOptions } from '../types'

export function useChatSSE() {
  const isStreaming = ref(false)
  const streamContent = ref('')
  const error = ref<Error | null>(null)
  let abortController: AbortController | null = null

  async function startStream(options: ChatSSEOptions) {
    isStreaming.value = true
    streamContent.value = ''
    error.value = null
    abortController = new AbortController()

    try {
      const response = await fetch(options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(options.body),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              options.onDone()
              isStreaming.value = false
              return
            }
            try {
              const chunk: SSEChunk = JSON.parse(data)
              streamContent.value += chunk.content
              options.onChunk(chunk)
            } catch {
              // skip non-JSON lines
            }
          }
        }
      }
      options.onDone()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        error.value = e as Error
        options.onError(e as Error)
      }
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function stopStream() {
    abortController?.abort()
    isStreaming.value = false
  }

  onUnmounted(() => {
    stopStream()
  })

  return {
    isStreaming,
    streamContent,
    error,
    startStream,
    stopStream,
  }
}
