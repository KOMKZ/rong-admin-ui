import type { App } from 'vue'
import type { AppPlugin } from '../app-core/types'
import type { DiscreteApiProvider, PluginManagerConfig } from './types'

let _discreteApi: DiscreteApiProvider | null = null

export function getDiscreteApi(): DiscreteApiProvider {
  if (!_discreteApi) {
    throw new Error(
      '[app-plugin] DiscreteApi not initialized. Ensure UI library adapter provides setupDiscreteApi.',
    )
  }
  return _discreteApi
}

export function createPluginManager(config: PluginManagerConfig): AppPlugin {
  return {
    name: 'app-plugin-manager',
    install(app: App): void {
      if (config.uiLibrary) {
        config.uiLibrary.install(app)

        if (config.uiLibrary.setupDiscreteApi) {
          _discreteApi = config.uiLibrary.setupDiscreteApi()
        }
      }

      if (config.directives) {
        for (const { name, directive } of config.directives) {
          app.directive(name, directive)
        }
      }
    },
    order: 10,
  }
}
