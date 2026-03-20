<script setup lang="ts">
import { computed } from 'vue'
import { Globe, Search, Monitor, Plug } from 'lucide-vue-next'
import RChatMarkdownRenderer from './RChatMarkdownRenderer.vue'
import type { SearchProgress, FetchProgress, MCPProgress, ToolCallEvent } from './types'
import { isFetchFallbackToolEvent, isToolInvocationEvent } from './types'

interface Props {
  content: string
  streaming?: boolean
  isThinking?: boolean
  toolCallName?: string
  searchProgress?: SearchProgress
  fetchProgress?: FetchProgress
  mcpProgress?: MCPProgress
  toolCallEvents?: ToolCallEvent[]
}

const props = withDefaults(defineProps<Props>(), {
  streaming: false,
  isThinking: false,
  toolCallName: '',
  searchProgress: () => ({ status: 'idle' as const }),
  fetchProgress: () => ({ status: 'idle' as const }),
  mcpProgress: () => ({ status: 'idle' as const }),
  toolCallEvents: () => [],
})

const isMcpCalling = computed(() => props.mcpProgress?.status === 'calling')
const isMcpDone = computed(() => props.mcpProgress?.status === 'done')
const showThinking = computed(
  () =>
    props.isThinking &&
    !props.content &&
    !isSearching.value &&
    !isFetching.value &&
    !isMcpCalling.value &&
    !isMcpDone.value,
)
const showToolCalling = computed(
  () =>
    !!props.toolCallName &&
    props.streaming &&
    !isSearching.value &&
    !isFetching.value &&
    !isMcpCalling.value,
)
const showContent = computed(() => !!props.content)
const isSearching = computed(() => props.searchProgress?.status === 'searching')
const isSearchDone = computed(() => props.searchProgress?.status === 'done')
const isFetching = computed(() => props.fetchProgress?.status === 'fetching')
const isFetchDone = computed(() => props.fetchProgress?.status === 'done')
const isPlaywright = computed(() => props.fetchProgress?.fetchMethod === 'playwright')

function formatLatency(ms: number | undefined): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function fetchMethodLabel(method?: string): string {
  if (method === 'playwright') return 'Playwright 浏览器'
  return 'HTTP'
}

function fetchFallbackLabel(reason: string): string {
  if (reason === 'spa_playwright') return '检测到 SPA 页面，切换到浏览器渲染…'
  return '正在使用浏览器引擎抓取…'
}
</script>

<template>
  <div class="r-chat-stream-renderer">
    <div v-if="isSearching" class="r-chat-stream-renderer__search-progress">
      <div class="r-chat-stream-renderer__search-bar">
        <Search :size="16" class="r-chat-stream-renderer__search-icon" />
        <span>正在搜索: {{ searchProgress?.query || '...' }}</span>
        <span v-if="searchProgress?.provider" class="r-chat-stream-renderer__method-tag r-chat-stream-renderer__method-tag--search">{{ searchProgress.provider }}</span>
        <span class="r-chat-stream-renderer__dots">
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
        </span>
      </div>
    </div>

    <div v-if="isSearchDone && !showContent" class="r-chat-stream-renderer__search-done">
      <div class="r-chat-stream-renderer__search-bar r-chat-stream-renderer__search-bar--done">
        <Search :size="16" class="r-chat-stream-renderer__search-icon" />
        <span>找到 {{ searchProgress?.resultCount ?? 0 }} 条结果</span>
        <span v-if="searchProgress?.provider" class="r-chat-stream-renderer__method-tag r-chat-stream-renderer__method-tag--search">{{ searchProgress.provider }}</span>
      </div>
      <span class="r-chat-stream-renderer__thinking">
        正在整合搜索结果<span class="r-chat-stream-renderer__dots">
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
        </span>
      </span>
    </div>

    <div v-if="isFetching" class="r-chat-stream-renderer__fetch-progress">
      <div class="r-chat-stream-renderer__search-bar">
        <Globe :size="16" class="r-chat-stream-renderer__search-icon" />
        <span>正在访问 {{ fetchProgress?.domain || '...' }}...</span>
        <span class="r-chat-stream-renderer__dots">
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
        </span>
      </div>
    </div>

    <div v-if="isFetchDone && !showContent" class="r-chat-stream-renderer__fetch-done">
      <div class="r-chat-stream-renderer__search-bar" :class="isPlaywright ? 'r-chat-stream-renderer__search-bar--playwright' : 'r-chat-stream-renderer__search-bar--done'">
        <Monitor v-if="isPlaywright" :size="16" class="r-chat-stream-renderer__search-icon" />
        <Globe v-else :size="16" class="r-chat-stream-renderer__search-icon" />
        <span>已获取页面内容 ({{ fetchProgress?.statusCode ?? '—' }}, {{ formatLatency(fetchProgress?.latencyMs) }})</span>
        <span class="r-chat-stream-renderer__method-tag" :class="isPlaywright ? 'r-chat-stream-renderer__method-tag--playwright' : 'r-chat-stream-renderer__method-tag--http'">{{ fetchMethodLabel(fetchProgress?.fetchMethod) }}</span>
      </div>
    </div>

    <div v-if="isMcpCalling" class="r-chat-stream-renderer__mcp-progress">
      <div class="r-chat-stream-renderer__mcp-bar">
        <Plug :size="16" class="r-chat-stream-renderer__mcp-icon" />
        <span>🔌 正在调用 MCP 工具: {{ mcpProgress?.serverName || '…' }}/{{ mcpProgress?.toolName || '…' }}...</span>
        <span class="r-chat-stream-renderer__dots">
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
          <span class="r-chat-stream-renderer__dot" />
        </span>
      </div>
    </div>

    <div v-if="isMcpDone && !showContent" class="r-chat-stream-renderer__mcp-done-block">
      <div class="r-chat-stream-renderer__mcp-bar r-chat-stream-renderer__mcp-bar--done">
        <Plug :size="16" class="r-chat-stream-renderer__mcp-icon" />
        <span>已完成 MCP 工具调用</span>
        <span class="r-chat-stream-renderer__method-tag r-chat-stream-renderer__method-tag--mcp">({{ mcpProgress?.serverName || '—' }}/{{ mcpProgress?.toolName || '—' }})</span>
      </div>
    </div>

    <span v-else-if="showThinking" class="r-chat-stream-renderer__thinking">
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
      <div v-if="isSearchDone && showContent" class="r-chat-stream-renderer__search-done-compact">
        <Search :size="14" />
        <span>已搜索 {{ searchProgress?.resultCount ?? 0 }} 条结果</span>
        <span v-if="searchProgress?.provider" class="r-chat-stream-renderer__method-tag r-chat-stream-renderer__method-tag--search r-chat-stream-renderer__method-tag--sm">{{ searchProgress.provider }}</span>
      </div>
      <div v-if="isFetchDone && showContent" class="r-chat-stream-renderer__search-done-compact" :class="{ 'r-chat-stream-renderer__search-done-compact--playwright': isPlaywright }">
        <Monitor v-if="isPlaywright" :size="14" />
        <Globe v-else :size="14" />
        <span>已获取页面内容 ({{ fetchProgress?.statusCode ?? '—' }}, {{ formatLatency(fetchProgress?.latencyMs) }})</span>
        <span class="r-chat-stream-renderer__method-tag r-chat-stream-renderer__method-tag--sm" :class="isPlaywright ? 'r-chat-stream-renderer__method-tag--playwright' : 'r-chat-stream-renderer__method-tag--http'">{{ fetchMethodLabel(fetchProgress?.fetchMethod) }}</span>
      </div>
      <div v-if="isMcpDone && showContent" class="r-chat-stream-renderer__search-done-compact r-chat-stream-renderer__search-done-compact--mcp">
        <Plug :size="14" />
        <span>已完成 MCP 工具调用</span>
        <span class="r-chat-stream-renderer__method-tag r-chat-stream-renderer__method-tag--sm r-chat-stream-renderer__method-tag--mcp">({{ mcpProgress?.serverName || '—' }}/{{ mcpProgress?.toolName || '—' }})</span>
      </div>
      <div v-if="toolCallEvents.length > 0" class="r-chat-stream-renderer__tool-events">
        <template v-for="(evt, idx) in toolCallEvents" :key="idx">
          <div
            v-if="isFetchFallbackToolEvent(evt)"
            class="r-chat-stream-renderer__fetch-fallback"
          >
            <div class="r-chat-stream-renderer__search-bar">
              <Globe :size="16" class="r-chat-stream-renderer__search-icon" />
              <span>{{ fetchFallbackLabel(evt.reason) }}</span>
              <span class="r-chat-stream-renderer__dots">
                <span class="r-chat-stream-renderer__dot" />
                <span class="r-chat-stream-renderer__dot" />
                <span class="r-chat-stream-renderer__dot" />
              </span>
            </div>
            <div v-if="evt.url" class="r-chat-stream-renderer__fetch-fallback-url">{{ evt.url }}</div>
          </div>
          <details
            v-else-if="isToolInvocationEvent(evt)"
            class="r-chat-stream-renderer__tool-event"
          >
            <summary class="r-chat-stream-renderer__tool-event-summary">
              <span class="r-chat-stream-renderer__tool-event-icon">🔧</span>
              <span>{{ evt.name }}</span>
              <span v-if="evt.result" class="r-chat-stream-renderer__tool-event-check">✓</span>
              <span v-else class="r-chat-stream-renderer__dots">
                <span class="r-chat-stream-renderer__dot" />
                <span class="r-chat-stream-renderer__dot" />
                <span class="r-chat-stream-renderer__dot" />
              </span>
              <span v-if="evt.latencyMs" class="r-chat-stream-renderer__tool-event-latency">{{ evt.latencyMs }}ms</span>
            </summary>
            <div class="r-chat-stream-renderer__tool-event-detail">
              <div v-if="evt.args" class="r-chat-stream-renderer__tool-event-section">
                <span class="r-chat-stream-renderer__tool-event-label">参数</span>
                <pre class="r-chat-stream-renderer__tool-event-pre">{{ evt.args }}</pre>
              </div>
              <div v-if="evt.result" class="r-chat-stream-renderer__tool-event-section">
                <span class="r-chat-stream-renderer__tool-event-label">结果</span>
                <pre class="r-chat-stream-renderer__tool-event-pre">{{ evt.result }}</pre>
              </div>
            </div>
          </details>
        </template>
      </div>
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
.r-chat-stream-renderer__search-progress,
.r-chat-stream-renderer__search-done {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.r-chat-stream-renderer__search-bar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--ra-color-primary-light, #e8f0fe);
  color: var(--ra-color-primary, #2563eb);
  font-size: 13px;
  font-weight: 500;
  width: fit-content;
}
.r-chat-stream-renderer__search-bar--done {
  background: var(--ra-color-success-light, #e6f7ed);
  color: var(--ra-color-success, #18a058);
}
.r-chat-stream-renderer__search-icon {
  flex-shrink: 0;
  opacity: 0.85;
}
.r-chat-stream-renderer__search-provider {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 4px;
}
.r-chat-stream-renderer__search-bar--playwright {
  background: var(--ra-color-warning-light, #fff7e6);
  color: var(--ra-color-warning, #d97706);
}
.r-chat-stream-renderer__method-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.r-chat-stream-renderer__method-tag--sm {
  padding: 0 4px;
  font-size: 10px;
}
.r-chat-stream-renderer__method-tag--search {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}
.r-chat-stream-renderer__method-tag--http {
  background: rgba(24, 160, 88, 0.12);
  color: #18a058;
}
.r-chat-stream-renderer__method-tag--playwright {
  background: rgba(217, 119, 6, 0.12);
  color: #d97706;
}
.r-chat-stream-renderer__search-done-compact {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ra-color-success, #18a058);
  margin-bottom: 6px;
  opacity: 0.85;
}
.r-chat-stream-renderer__search-done-compact--playwright {
  color: var(--ra-color-warning, #d97706);
}
.r-chat-stream-renderer__mcp-progress,
.r-chat-stream-renderer__mcp-done-block {
  margin-bottom: 8px;
}
.r-chat-stream-renderer__mcp-bar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(124, 58, 237, 0.1);
  color: #6d28d9;
  font-size: 13px;
  font-weight: 500;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
}
.r-chat-stream-renderer__mcp-bar--done {
  background: rgba(124, 58, 237, 0.08);
  color: #5b21b6;
}
.r-chat-stream-renderer__mcp-icon {
  flex-shrink: 0;
  opacity: 0.9;
}
.r-chat-stream-renderer__method-tag--mcp {
  background: rgba(124, 58, 237, 0.15);
  color: #6d28d9;
}
.r-chat-stream-renderer__search-done-compact--mcp {
  color: #6d28d9;
}
.r-chat-stream-renderer__fetch-fallback {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}
.r-chat-stream-renderer__fetch-fallback-url {
  font-size: 11px;
  color: var(--ra-color-text-tertiary, #6e7389);
  word-break: break-all;
  padding-left: 2px;
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
.r-chat-stream-renderer__tool-events {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.r-chat-stream-renderer__tool-event {
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: 6px;
  overflow: hidden;
}
.r-chat-stream-renderer__tool-event-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--ra-color-text-secondary, #6e7389);
  cursor: pointer;
  background: var(--ra-color-bg-subtle, #f8fafc);
  user-select: none;
}
.r-chat-stream-renderer__tool-event-summary:hover {
  background: var(--ra-color-bg-hover, #f0f0f5);
}
.r-chat-stream-renderer__tool-event-icon {
  font-size: 14px;
  opacity: 0.7;
}
.r-chat-stream-renderer__tool-event-check {
  color: var(--ra-color-success, #18a058);
  font-weight: 600;
}
.r-chat-stream-renderer__tool-event-latency {
  font-size: 10px;
  color: var(--ra-color-text-tertiary, #999);
  margin-left: auto;
}
.r-chat-stream-renderer__tool-event-detail {
  padding: 8px 10px;
  border-top: 1px solid var(--ra-color-border-light, #eef0f6);
}
.r-chat-stream-renderer__tool-event-section {
  margin-bottom: 6px;
}
.r-chat-stream-renderer__tool-event-section:last-child {
  margin-bottom: 0;
}
.r-chat-stream-renderer__tool-event-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--ra-color-text-secondary, #6e7389);
  margin-bottom: 2px;
  display: block;
}
.r-chat-stream-renderer__tool-event-pre {
  margin: 0;
  padding: 6px 8px;
  background: var(--ra-color-bg-tertiary, #f5f6f8);
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
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
