import { inject, provide, reactive, readonly, type DeepReadonly } from 'vue'
import type { DesignConfig, ProjectConfig, RuntimeConfig, WebsiteConfig } from './types'

const CONFIG_INJECTION_KEY = Symbol('rong-config')

export interface AppConfigContext {
  design: DeepReadonly<DesignConfig>
  project: DeepReadonly<ProjectConfig>
  runtime: DeepReadonly<RuntimeConfig>
  website: DeepReadonly<WebsiteConfig>
  updateDesign: (partial: Partial<DesignConfig>) => void
  updateProject: (partial: Partial<ProjectConfig>) => void
}

export interface AppConfigInput {
  design: DesignConfig
  project: ProjectConfig
  runtime: RuntimeConfig
  website: WebsiteConfig
}

const defaultDesignConfig: DesignConfig = {
  darkMode: false,
  primaryColor: '#2080f0',
  borderRadius: 6,
  fontSize: 14,
}

const defaultProjectConfig: ProjectConfig = {
  title: 'Admin',
  logo: '',
  navMode: 'vertical',
  permissionMode: 'backend',
  showBreadcrumb: true,
  showTabs: true,
  showFooter: true,
  pageAnimate: true,
  pageAnimateType: 'fade',
  headerFixed: true,
  sidebarCollapsed: false,
  lockScreenTimeout: 0,
}

const defaultRuntimeConfig: RuntimeConfig = {
  apiBaseURL: '/api',
  env: 'development',
  debug: false,
}

const defaultWebsiteConfig: WebsiteConfig = {
  title: 'Admin System',
  logo: '',
}

export function createAppConfig(input?: Partial<AppConfigInput>): AppConfigContext {
  const design = reactive<DesignConfig>({ ...defaultDesignConfig, ...input?.design })
  const project = reactive<ProjectConfig>({ ...defaultProjectConfig, ...input?.project })
  const runtime = reactive<RuntimeConfig>({ ...defaultRuntimeConfig, ...input?.runtime })
  const website = reactive<WebsiteConfig>({ ...defaultWebsiteConfig, ...input?.website })

  const context: AppConfigContext = {
    design: readonly(design),
    project: readonly(project),
    runtime: readonly(runtime),
    website: readonly(website),
    updateDesign(partial) {
      Object.assign(design, partial)
    },
    updateProject(partial) {
      Object.assign(project, partial)
    },
  }

  provide(CONFIG_INJECTION_KEY, context)
  return context
}

export function useAppConfig(): AppConfigContext {
  const context = inject<AppConfigContext>(CONFIG_INJECTION_KEY)
  if (!context) {
    throw new Error(
      '[app-config] AppConfig not provided. Call createAppConfig in a parent component.',
    )
  }
  return context
}
