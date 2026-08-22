import type { ComputedRef, Ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export type MenuSourceMode = 'local' | 'remote'

export interface AppMenuItem {
  name: string
  path: string
  title: string
  icon?: string
  hidden?: boolean
  meta?: Record<string, unknown>
  children?: AppMenuItem[]
}

export interface MenuSourceOptions {
  mode?: MenuSourceMode
  localMenus?: AppMenuItem[]
  loadRemoteMenus?: () => Promise<AppMenuItem[]>
}

export interface MenuSourceInstance {
  mode: Ref<MenuSourceMode>
  menus: ComputedRef<AppMenuItem[]>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<unknown>>
  setMode: (mode: MenuSourceMode) => void
  setLocalMenus: (menus: AppMenuItem[]) => void
  setRemoteMenus: (menus: AppMenuItem[]) => void
  load: () => Promise<AppMenuItem[]>
  reset: () => void
}

export type RouteMenuSource = RouteRecordRaw[]
