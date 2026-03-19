export interface ChatConversation {
  id: number
  title: string
  admin_id: number
  provider_id: number
  model: string
  system_prompt: string
  status: 'active' | 'archived' | 'deleted'
  pinned?: boolean
  favorite?: boolean
  summary: string
  message_count: number
  token_usage: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  conversation_id: number
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  token_count: number
  metadata?: Record<string, unknown>
  parent_message_id?: number
  status: 'active' | 'deleted'
  created_at: string
  feedback?: string
}

export interface SSEChunk {
  content?: string
  index?: number
  /** CHATADV-013: tool_calls from streaming response */
  tool_calls?: Array<{ id?: string; name?: string; arguments?: string }>
  finish_reason?: string
}

export interface ChatSSEOptions {
  url: string
  body: Record<string, unknown>
  headers?: Record<string, string>
  onChunk: (chunk: SSEChunk) => void
  onDone: () => void
  onError: (error: Error) => void
}
