import { inject, provide, reactive, readonly, type DeepReadonly } from 'vue'
import type { LayoutConfig, NavMode, PageAnimateType } from './types'

const LAYOUT_INJECTION_KEY = Symbol('rong-layout-config')

const defaultLayoutConfig: LayoutConfig = {
  navMode: 'vertical',
  sidebarCollapsed: false,
  sidebarWidth: 200,
  sidebarCollapsedWidth: 64,
  headerHeight: 64,
  headerFixed: true,
  footerVisible: true,
  footerHeight: 48,
  contentFullScreen: false,
  showBreadcrumb: true,
  showTabs: true,
  pageAnimate: true,
  pageAnimateType: 'fade',
}

export interface LayoutActions {
  setNavMode: (mode: NavMode) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setHeaderFixed: (fixed: boolean) => void
  setFooterVisible: (visible: boolean) => void
  setContentFullScreen: (fullScreen: boolean) => void
  setShowBreadcrumb: (show: boolean) => void
  setShowTabs: (show: boolean) => void
  setPageAnimate: (animate: boolean) => void
  setPageAnimateType: (type: PageAnimateType) => void
}

export interface LayoutContext {
  config: DeepReadonly<LayoutConfig>
  actions: LayoutActions
}

export function createLayoutProvider(initial?: Partial<LayoutConfig>): LayoutContext {
  const config = reactive<LayoutConfig>({ ...defaultLayoutConfig, ...initial })

  const actions: LayoutActions = {
    setNavMode: (mode) => {
      config.navMode = mode
    },
    toggleSidebar: () => {
      config.sidebarCollapsed = !config.sidebarCollapsed
    },
    setSidebarCollapsed: (collapsed) => {
      config.sidebarCollapsed = collapsed
    },
    setHeaderFixed: (fixed) => {
      config.headerFixed = fixed
    },
    setFooterVisible: (visible) => {
      config.footerVisible = visible
    },
    setContentFullScreen: (fullScreen) => {
      config.contentFullScreen = fullScreen
    },
    setShowBreadcrumb: (show) => {
      config.showBreadcrumb = show
    },
    setShowTabs: (show) => {
      config.showTabs = show
    },
    setPageAnimate: (animate) => {
      config.pageAnimate = animate
    },
    setPageAnimateType: (type) => {
      config.pageAnimateType = type
    },
  }

  const context: LayoutContext = {
    config: readonly(config),
    actions,
  }

  provide(LAYOUT_INJECTION_KEY, context)
  return context
}

export function useLayout(): LayoutContext {
  const context = inject<LayoutContext>(LAYOUT_INJECTION_KEY)
  if (!context) {
    throw new Error(
      '[app-layout] Layout context not provided. Wrap your app with createLayoutProvider.',
    )
  }
  return context
}
