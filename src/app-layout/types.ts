import type { Component } from 'vue'

export type NavMode = 'vertical' | 'horizontal' | 'horizontal-mix'

export interface LayoutConfig {
  navMode: NavMode
  sidebarCollapsed: boolean
  sidebarWidth: number
  sidebarCollapsedWidth: number
  headerHeight: number
  headerFixed: boolean
  footerVisible: boolean
  footerHeight: number
  contentFullScreen: boolean
  showBreadcrumb: boolean
  showTabs: boolean
  pageAnimate: boolean
  pageAnimateType: PageAnimateType
}

export type PageAnimateType = 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'none'

export interface LayoutSlots {
  logo?: Component
  header?: Component
  sidebar?: Component
  content?: Component
  footer?: Component
  tabsView?: Component
}

export interface MenuItem {
  key: string
  label: string
  icon?: string | Component
  children?: MenuItem[]
  path?: string
  hidden?: boolean
  disabled?: boolean
  affix?: boolean
  externalLink?: string
  meta?: Record<string, unknown>
}

export interface BreadcrumbItem {
  label: string
  path?: string
  icon?: string | Component
}
