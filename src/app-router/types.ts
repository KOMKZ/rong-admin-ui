import type { Component } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'

export interface RouteModuleConfig {
  name: string
  path: string
  component?: Component
  redirect?: string
  meta?: RouteMeta & Record<string, unknown>
  children?: RouteModuleConfig[]
  order?: number
}

export interface RouteMeta {
  title: string
  icon?: string
  hidden?: boolean
  affix?: boolean
  keepAlive?: boolean
  permissions?: string[]
  externalLink?: string
  activeMenu?: string
}

export interface MenuDataItem {
  id: number | string
  parentId: number | string | null
  name: string
  path: string
  component?: string
  redirect?: string
  icon?: string
  orderNum?: number
  hidden?: boolean
  meta?: Record<string, unknown>
  children?: MenuDataItem[]
}

export interface RouteGeneratorOptions {
  layoutComponent: Component
  parentLayoutComponent: Component
  viewModules: Record<string, () => Promise<Component>>
  notFoundComponent: Component
}

export interface RouterSetupConfig {
  staticRoutes: RouteRecordRaw[]
  whiteList: string[]
  loginPath: string
  homePath: string
  notFoundPath: string
}

export type MenuToRouteConverter = (menus: MenuDataItem[]) => RouteRecordRaw[]

export type DynamicRouteLoader = () => Promise<RouteRecordRaw[]>

export interface RouterGuardHooks {
  beforeAuth?: (to: string, from: string) => boolean | string | undefined
  afterAuth?: (to: string) => void
  onAuthFail?: (to: string) => string
}

export interface RouterContext {
  router: Router
  addDynamicRoutes: (routes: RouteRecordRaw[]) => void
  resetRoutes: () => void
}
