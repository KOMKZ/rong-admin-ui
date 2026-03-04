import type { App, Directive } from 'vue'

export interface UILibraryAdapter {
  name: string
  install: (app: App) => void
  setupDiscreteApi?: () => DiscreteApiProvider
}

export interface DiscreteApiProvider {
  message: MessageApi
  dialog: DialogApi
  notification: NotificationApi
  loadingBar: LoadingBarApi
}

export interface MessageApi {
  success: (content: string) => void
  error: (content: string) => void
  warning: (content: string) => void
  info: (content: string) => void
}

export interface DialogApi {
  warning: (options: DialogOptions) => void
  error: (options: DialogOptions) => void
  info: (options: DialogOptions) => void
}

export interface DialogOptions {
  title: string
  content: string
  positiveText?: string
  negativeText?: string
  onPositiveClick?: () => void | Promise<void>
  onNegativeClick?: () => void
}

export interface NotificationApi {
  success: (options: NotificationOptions) => void
  error: (options: NotificationOptions) => void
  warning: (options: NotificationOptions) => void
  info: (options: NotificationOptions) => void
}

export interface NotificationOptions {
  title: string
  content?: string
  duration?: number
}

export interface LoadingBarApi {
  start: () => void
  finish: () => void
  error: () => void
}

export interface DirectiveDefinition {
  name: string
  directive: Directive
}

export interface PluginManagerConfig {
  uiLibrary?: UILibraryAdapter
  directives?: DirectiveDefinition[]
}
