import type { NavMode, PageAnimateType } from '../app-layout/types'

export interface DesignConfig {
  darkMode: boolean
  primaryColor: string
  borderRadius: number
  fontSize: number
}

export interface ProjectConfig {
  title: string
  logo: string
  navMode: NavMode
  permissionMode: PermissionMode
  showBreadcrumb: boolean
  showTabs: boolean
  showFooter: boolean
  pageAnimate: boolean
  pageAnimateType: PageAnimateType
  headerFixed: boolean
  sidebarCollapsed: boolean
  lockScreenTimeout: number
}

export type PermissionMode = 'frontend' | 'backend'

export interface RuntimeConfig {
  apiBaseURL: string
  uploadURL?: string
  wsURL?: string
  env: AppEnv
  debug: boolean
}

export type AppEnv = 'development' | 'staging' | 'production'

export interface WebsiteConfig {
  title: string
  logo: string
  loginImage?: string
  loginDesc?: string
  copyright?: string
}

export interface ConfigStore<T> {
  getConfig: () => Readonly<T>
  setConfig: (partial: Partial<T>) => void
  resetConfig: () => void
}
