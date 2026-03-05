export type NotificationType = 'success' | 'warning' | 'error' | 'info'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description?: string
  timestamp: number
  read: boolean
  /** Auto-dismiss after ms; 0 = persistent */
  duration?: number
  /** Action callback */
  onAction?: () => void
  actionLabel?: string
}

export interface NotificationCenterProps {
  notifications: NotificationItem[]
  maxVisible?: number
  /** Show badge with unread count */
  showBadge?: boolean
  /** Position for the popover panel */
  placement?: 'bottom-end' | 'bottom-start' | 'bottom'
}

export interface NotificationCenterEmits {
  'update:notifications': [notifications: NotificationItem[]]
  read: [id: string]
  'read-all': []
  dismiss: [id: string]
  'clear-all': []
  action: [item: NotificationItem]
}

export interface NotificationCenterExpose {
  push: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => string
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void
  clearAll: () => void
  unreadCount: number
}
