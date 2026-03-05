import type { Component } from 'vue'
import type { MenuItem, BreadcrumbItem } from '../../app-layout/types'

export interface AppShellProps {
  sidebarCollapsed?: boolean
  sidebarWidth?: number
  collapsedWidth?: number
  headerHeight?: number
  headerFixed?: boolean
  footerVisible?: boolean
  footerHeight?: number
  showBreadcrumb?: boolean
  showTabs?: boolean
}

export interface SideNavProps {
  menus: MenuItem[]
  collapsed?: boolean
  activeKey?: string
  logo?: string
  title?: string
  collapsedWidth?: number
  expandedWidth?: number
}

export interface SideNavEmits {
  (e: 'select', key: string): void
  (e: 'update:collapsed', collapsed: boolean): void
}

export interface TopbarProps {
  title?: string
  logo?: string
  breadcrumbs?: BreadcrumbItem[]
  showBreadcrumb?: boolean
  height?: number
}

export interface TopbarEmits {
  (e: 'toggle-sidebar'): void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export interface BreadcrumbEmits {
  (e: 'navigate', path: string): void
}

export interface TabItem {
  key: string
  label: string
  path: string
  closable?: boolean
  icon?: string | Component
  affix?: boolean
}

export interface TabsViewProps {
  tabs: TabItem[]
  activeKey?: string
}

export interface TabsViewEmits {
  (e: 'select', key: string): void
  (e: 'close', key: string): void
  (e: 'close-other', key: string): void
  (e: 'close-all'): void
}
