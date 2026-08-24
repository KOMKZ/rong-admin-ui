<script lang="ts" setup>
  import { computed, ref, type PropType } from 'vue'
  import {
    NBadge,
    NButton,
    NDrawer,
    NDrawerContent,
    NEmpty,
    NModal,
    NSpace,
    NTabPane,
    NTabs,
  } from 'naive-ui'
  import { RIcon } from '../icon'
  import type { NotificationItem, NotificationType, NotificationCenterExpose } from './types'

  const props = defineProps({
    notifications: { type: Array as PropType<NotificationItem[]>, required: true },
    maxVisible: { type: Number, default: 50 },
    showBadge: { type: Boolean, default: true },
    placement: {
      type: String as PropType<'bottom-end' | 'bottom-start' | 'bottom'>,
      default: 'bottom-end',
    },
  })

  const emit = defineEmits<{
    'update:notifications': [notifications: NotificationItem[]]
    read: [id: string]
    'read-all': []
    dismiss: [id: string]
    'clear-all': []
    action: [item: NotificationItem]
  }>()

  const panelOpen = ref(false)
  const detailOpen = ref(false)
  const selectedNotification = ref<NotificationItem | null>(null)
  const activeTab = ref<'unread' | 'read'>('unread')
  const detailModalStyle = {
    width: 'min(420px, calc(100vw - 32px))',
    maxWidth: 'calc(100vw - 32px)',
  }

  const unreadCount = computed(() => props.notifications.filter((n) => !n.read).length)
  const readCount = computed(() => props.notifications.filter((n) => n.read).length)

  const visibleNotifications = computed(() =>
    [...props.notifications]
      .filter((item) => (activeTab.value === 'unread' ? !item.read : item.read))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, props.maxVisible),
  )

  const typeIconMap: Record<NotificationType, string> = {
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'x-circle',
    info: 'info',
  }

  const typeColorClass: Record<NotificationType, string> = {
    success: 'r-notif--success',
    warning: 'r-notif--warning',
    error: 'r-notif--error',
    info: 'r-notif--info',
  }

  function generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }

  function push(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): string {
    const id = generateId()
    const newItem: NotificationItem = {
      ...item,
      id,
      timestamp: Date.now(),
      read: false,
    }
    const updated = [newItem, ...props.notifications]
    emit('update:notifications', updated)

    if (item.duration && item.duration > 0) {
      setTimeout(() => dismiss(id), item.duration)
    }

    return id
  }

  function markRead(id: string): void {
    const updated = props.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    emit('update:notifications', updated)
    emit('read', id)
  }

  function markAllRead(): void {
    const updated = props.notifications.map((n) => ({ ...n, read: true }))
    emit('update:notifications', updated)
    emit('read-all')
  }

  function dismiss(id: string): void {
    const updated = props.notifications.filter((n) => n.id !== id)
    emit('update:notifications', updated)
    emit('dismiss', id)
  }

  function clearAll(): void {
    emit('update:notifications', [])
    emit('clear-all')
  }

  function handleAction(item: NotificationItem): void {
    item.onAction?.()
    emit('action', item)
  }

  function handleItemClick(item: NotificationItem): void {
    if (!item.read) markRead(item.id)
    selectedNotification.value = item
    detailOpen.value = true
  }

  function formatTime(ts: number): string {
    const diff = Date.now() - ts
    if (diff < 60_000) return '刚刚'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
    return new Date(ts).toLocaleDateString()
  }

  function detailTrigger(item: NotificationItem): string {
    const source = item.metadata?.trigger || item.metadata?.source || item.metadata?.type_code
    return typeof source === 'string' && source ? source : item.type
  }

  const expose: NotificationCenterExpose = {
    push,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    get unreadCount() {
      return unreadCount.value
    },
  }

  defineExpose(expose)
</script>

<template>
  <button
    class="r-notif-trigger"
    aria-label="Notifications"
    data-testid="notification-trigger"
    @click="panelOpen = true"
  >
    <NBadge v-if="showBadge && unreadCount > 0" :value="unreadCount" :max="99">
      <RIcon name="bell" size="sm" />
    </NBadge>
    <RIcon v-else name="bell" size="sm" />
  </button>

  <NDrawer v-model:show="panelOpen" :width="420" placement="right" data-testid="notification-panel">
    <NDrawerContent closable>
      <template #header>
        <div class="r-notif-panel__drawer-header">
          <span class="r-notif-panel__title">
            通知
            <span v-if="unreadCount > 0" class="r-notif-panel__count">{{ unreadCount }}</span>
          </span>
          <NSpace size="small">
            <NButton text size="tiny" :disabled="unreadCount === 0" @click="markAllRead">
              全部已读
            </NButton>
            <NButton text size="tiny" :disabled="notifications.length === 0" @click="clearAll">
              清空
            </NButton>
          </NSpace>
        </div>
      </template>

      <div class="r-notif-panel">
        <NTabs v-model:value="activeTab" size="small" class="r-notif-panel__tabs">
          <NTabPane name="unread" :tab="`未读 ${unreadCount}`" />
          <NTabPane name="read" :tab="`已读 ${readCount}`" />
        </NTabs>
        <div class="r-notif-panel__list">
          <NEmpty
            v-if="visibleNotifications.length === 0"
            :description="activeTab === 'unread' ? '暂无未读通知' : '暂无已读通知'"
          />
          <div
            v-for="item in visibleNotifications"
            :key="item.id"
            class="r-notif-item"
            :class="[typeColorClass[item.type], { 'r-notif-item--unread': !item.read }]"
            :data-testid="`notification-item-${item.id}`"
            @click="handleItemClick(item)"
          >
            <div class="r-notif-item__icon">
              <RIcon :name="typeIconMap[item.type]" size="sm" />
            </div>
            <div class="r-notif-item__body">
              <div class="r-notif-item__title">{{ item.title }}</div>
              <div v-if="item.description" class="r-notif-item__desc">{{ item.description }}</div>
              <div class="r-notif-item__meta">
                <span class="r-notif-item__time">{{ formatTime(item.timestamp) }}</span>
                <NButton
                  v-if="item.actionLabel"
                  text
                  size="tiny"
                  type="primary"
                  @click.stop="handleAction(item)"
                >
                  {{ item.actionLabel }}
                </NButton>
              </div>
            </div>
            <button
              class="r-notif-item__dismiss"
              aria-label="Dismiss"
              @click.stop="dismiss(item.id)"
            >
              <RIcon name="x" size="xs" />
            </button>
          </div>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>

  <NModal
    v-model:show="detailOpen"
    preset="card"
    :title="selectedNotification?.title || '通知详情'"
    class="r-notif-detail"
    :style="detailModalStyle"
  >
    <div v-if="selectedNotification" class="r-notif-detail__body">
      <div class="r-notif-detail__row">
        <span>触发</span>
        <strong>{{ detailTrigger(selectedNotification) }}</strong>
      </div>
      <div class="r-notif-detail__row">
        <span>消息主体</span>
        <p>{{ selectedNotification.description || selectedNotification.title }}</p>
      </div>
      <div class="r-notif-detail__row">
        <span>时间</span>
        <strong>
          {{ new Date(selectedNotification.timestamp).toLocaleString() }}
        </strong>
      </div>
      <div v-if="selectedNotification.actionLabel" class="r-notif-detail__actions">
        <NButton type="primary" @click="handleAction(selectedNotification)">
          {{ selectedNotification.actionLabel }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
  .r-notif-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-md);
    cursor: pointer;
    color: var(--ra-color-text-secondary);
    transition: all var(--ra-transition-fast);
  }
  .r-notif-trigger:hover {
    background: var(--ra-color-bg-hover);
    color: var(--ra-color-text-primary);
  }
  .r-notif-trigger:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .r-notif-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .r-notif-panel__drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ra-spacing-3);
    width: 100%;
  }
  .r-notif-panel__title {
    font-size: var(--ra-font-size-base);
    font-weight: var(--ra-font-weight-semibold);
    color: var(--ra-color-text-primary);
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-2);
  }
  .r-notif-panel__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: var(--ra-radius-full);
    background: var(--ra-color-brand-primary);
    color: #fff;
    font-size: var(--ra-font-size-xs);
    font-weight: var(--ra-font-weight-medium);
  }

  .r-notif-panel__list {
    overflow-y: auto;
    flex: 1;
    padding: var(--ra-spacing-1) 0;
  }
  .r-notif-panel__tabs {
    padding: 0 var(--ra-spacing-4);
  }

  .r-notif-item {
    display: flex;
    gap: var(--ra-spacing-3);
    padding: var(--ra-spacing-3) var(--ra-spacing-4);
    cursor: pointer;
    transition: background var(--ra-transition-fast);
    position: relative;
  }
  .r-notif-item:hover {
    background: var(--ra-color-bg-hover);
  }
  .r-notif-item--unread {
    background: var(--ra-color-bg-subtle);
  }
  .r-notif-item--unread::before {
    content: '';
    position: absolute;
    left: var(--ra-spacing-1);
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: var(--ra-radius-full);
    background: var(--ra-color-brand-primary);
  }

  .r-notif-item__icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ra-radius-md);
  }
  .r-notif--success .r-notif-item__icon {
    background: var(--ra-color-success-bg);
    color: var(--ra-color-success-text);
  }
  .r-notif--warning .r-notif-item__icon {
    background: var(--ra-color-warning-bg);
    color: var(--ra-color-warning-text);
  }
  .r-notif--error .r-notif-item__icon {
    background: var(--ra-color-danger-bg);
    color: var(--ra-color-danger-text);
  }
  .r-notif--info .r-notif-item__icon {
    background: var(--ra-color-info-bg, var(--ra-color-brand-bg));
    color: var(--ra-color-info-text, var(--ra-color-brand-primary));
  }

  .r-notif-item__body {
    flex: 1;
    min-width: 0;
  }
  .r-notif-item__title {
    font-size: var(--ra-font-size-sm);
    font-weight: var(--ra-font-weight-medium);
    color: var(--ra-color-text-primary);
    line-height: var(--ra-line-height-snug);
  }
  .r-notif-item__desc {
    font-size: var(--ra-font-size-xs);
    color: var(--ra-color-text-secondary);
    margin-top: var(--ra-spacing-0-5);
    line-height: var(--ra-line-height-relaxed);
  }
  .r-notif-item__meta {
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-2);
    margin-top: var(--ra-spacing-1);
  }
  .r-notif-item__time {
    font-size: var(--ra-font-size-xs);
    color: var(--ra-color-text-tertiary);
  }

  .r-notif-item__dismiss {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--ra-radius-sm);
    cursor: pointer;
    color: var(--ra-color-text-quaternary);
    opacity: 0;
    transition: all var(--ra-transition-fast);
  }
  .r-notif-item:hover .r-notif-item__dismiss {
    opacity: 1;
  }
  .r-notif-item__dismiss:hover {
    background: var(--ra-color-bg-hover);
    color: var(--ra-color-text-secondary);
  }

  .r-notif-detail {
    width: min(420px, calc(100vw - 32px));
  }
  .r-notif-detail__body {
    display: flex;
    flex-direction: column;
    gap: var(--ra-spacing-3);
  }
  .r-notif-detail__row {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: var(--ra-spacing-3);
    align-items: start;
  }
  .r-notif-detail__row > span {
    color: var(--ra-color-text-tertiary);
    font-size: var(--ra-font-size-sm);
  }
  .r-notif-detail__row strong {
    color: var(--ra-color-text-primary);
    font-size: var(--ra-font-size-sm);
    font-weight: var(--ra-font-weight-medium);
    word-break: break-word;
  }
  .r-notif-detail__row p {
    margin: 0;
    color: var(--ra-color-text-secondary);
    line-height: var(--ra-line-height-relaxed);
    word-break: break-word;
  }
  .r-notif-detail__actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
