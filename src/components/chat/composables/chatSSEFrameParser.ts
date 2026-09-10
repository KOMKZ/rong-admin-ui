import type { ChatSSEOptions, SSEChunk } from '../types'
import { handleAgentEvent, handleSSEChunk } from './chatSSEEvents'
import type { ChatSSEState } from './chatSSEState'

const DATA_EVENT_NAMES = new Set(['chunk', 'usage', 'error'])

export function createSSEFrameProcessor(
  state: ChatSSEState,
  options: ChatSSEOptions,
  clearHeartbeat: () => void,
) {
  let pendingEventName: string | undefined

  const processDataLine = (data: string): boolean => {
    if (data === '[DONE]') {
      clearHeartbeat()
      options.onDone()
      return true
    }
    try {
      const chunk: SSEChunk = JSON.parse(data)
      if (pendingEventName) {
        handleAgentEvent(state, pendingEventName, chunk as unknown as Record<string, unknown>, options.onChunk)
        pendingEventName = undefined
        return false
      }
      handleSSEChunk(state, chunk)
      options.onChunk(chunk)
    } catch {
      // skip non-JSON lines
    }
    return false
  }

  const processFrame = (frame: string): boolean => {
    const { eventName, payload } = parseSSEFrame(frame)
    if (!payload) {
      if (eventName) pendingEventName = eventName
      return false
    }
    pendingEventName = eventName ?? pendingEventName
    if (shouldHandleNamedEvent(pendingEventName, payload)) {
      try {
        handleAgentEvent(state, pendingEventName!, JSON.parse(payload), options.onChunk)
        pendingEventName = undefined
        return false
      } catch {
        /* fall through to processDataLine */
      }
    }
    pendingEventName = undefined
    return processDataLine(payload)
  }

  return { processFrame }
}

function parseSSEFrame(frame: string): { eventName?: string; payload: string } {
  const dataLines: string[] = []
  let eventName: string | undefined
  for (const raw of frame.split('\n')) {
    const line = raw.replace(/\r$/, '')
    if (line.startsWith('event:')) {
      eventName = line.slice(line.indexOf(':') + 1).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(line.indexOf(':') + 1).trimStart())
    }
  }
  return { eventName, payload: dataLines.join('\n') }
}

function shouldHandleNamedEvent(
  eventName: string | undefined,
  payload: string,
): boolean {
  return Boolean(eventName && payload !== '[DONE]' && !DATA_EVENT_NAMES.has(eventName))
}
