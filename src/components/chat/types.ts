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
  compaction_count?: number
  last_compaction_at?: string
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
  /** CHATWEB-008: search progress events injected by backend Tool Loop */
  /** CRED-025: fetch progress events for authenticated web fetch */
  event_type?:
    | 'chunk'
    | 'search_start'
    | 'search_done'
    | 'fetch_start'
    | 'fetch_done'
    | 'fetch_fallback'
    | 'mcp_tool_start'
    | 'mcp_tool_done'
    | 'tool_call'
    | 'tool_result'
    | 'usage'
    | 'error'
  /** usage event fields (CTX-007) */
  type?: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  input_cost?: number
  output_cost?: number
  total_cost?: number
  /** error event fields (CTX-006) */
  code?: string
  message?: string
  query?: string
  result_count?: number
  provider?: string
  tool_name?: string
  tool_args?: string
  tool_summary?: string
  latency_ms?: number
  /** fetch_start/fetch_done/fetch_fallback */
  url?: string
  domain?: string
  status_code?: number
  /** fetch_fallback: e.g. spa_playwright */
  reason?: string
  /** fetch_done: which engine was used */
  fetch_method?: 'http' | 'playwright'
  /** mcp_tool_start / mcp_tool_done (tool_name is also used for tool_call / tool_result) */
  server_name?: string
}

/** MCP tool call progress from SSE (mcp_tool_start / mcp_tool_done) */
export interface MCPProgress {
  status: 'idle' | 'calling' | 'done'
  serverName?: string
  toolName?: string
}

/** Agent execution progress from SSE (event: agent_start / agent_finish) */
export interface AgentProgress {
  status: 'idle' | 'running' | 'done'
  agentId?: number
  agentName?: string
  agentAvatar?: string
}

/** Option for @ MCP server picker in chat input */
export interface MCPServerOption {
  server_name: string
  server_display_name: string
  tools: Array<{ name: string; description: string }>
}

export interface SearchProgress {
  status: 'idle' | 'searching' | 'done'
  query?: string
  resultCount?: number
  provider?: string
}

/** CRED-025: fetch progress for authenticated web fetch */
export interface FetchProgress {
  status: 'idle' | 'fetching' | 'done'
  domain?: string
  statusCode?: number
  latencyMs?: number
  /** Which fetch engine was used: http (default) or playwright (headless browser) */
  fetchMethod?: 'http' | 'playwright'
}

/** tool_call / tool_result row */
export interface ToolInvocationEvent {
  name: string
  args?: string
  result?: string
  latencyMs?: number
}

/** web_fetch fell back to headless browser (e.g. SPA) */
export interface FetchFallbackEvent {
  type: 'fetch_fallback'
  url: string
  reason: string
}

export type ToolCallEvent = ToolInvocationEvent | FetchFallbackEvent

export function isFetchFallbackToolEvent(e: ToolCallEvent): e is FetchFallbackEvent {
  return (e as FetchFallbackEvent).type === 'fetch_fallback'
}

export function isToolInvocationEvent(e: ToolCallEvent): e is ToolInvocationEvent {
  return !isFetchFallbackToolEvent(e)
}

/** Token usage data from SSE usage event (CTX-007) */
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  inputCost?: number
  outputCost?: number
  totalCost?: number
}

/** Structured SSE error event (CTX-006) */
export interface SSEError {
  type: 'error'
  code: 'token_budget' | 'rate_limit' | 'content_filter' | 'provider_error' | string
  message: string
}

export interface ChatSSEOptions {
  url: string
  body: Record<string, unknown>
  headers?: Record<string, string>
  onChunk: (chunk: SSEChunk) => void
  onDone: () => void
  onError: (error: Error) => void
}
