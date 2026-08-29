export interface CaptchaConfig {
  enabled: boolean
  provider: 'aliyun'
  prefix: string
  scene: string
  region?: 'cn' | 'sgp'
  language?: 'cn' | 'tw' | 'en'
  mode?: 'popup' | 'embed'
  slideStyle?: { width: number; height: number }
  scriptUrl?: string
  timeout?: number
  rem?: number
  autoRefresh?: boolean
  immediate?: boolean
}

export interface CaptchaSceneToken {
  provider: string
  scene: string
  scene_id: string
  token: string
  expires_in: number
}

export type CaptchaSceneTokenLoader = (scene: string) => Promise<CaptchaSceneToken>

export type CaptchaVerifyCallback = (captchaVerifyParam: string) => void | Promise<void>

export type CaptchaErrorCallback = (error: Error) => void

export type CaptchaStatus = 'disabled' | 'loading' | 'ready' | 'error'

export interface CaptchaInstance {
  reset?: () => void
  show?: () => void
  hide?: () => void
}

export interface AliyunCaptchaGlobalConfig {
  region: 'cn' | 'sgp'
  prefix: string
}

declare global {
  interface Window {
    AliyunCaptchaConfig?: AliyunCaptchaGlobalConfig
    initAliyunCaptcha?: (options: AliyunCaptchaOptions) => void
  }
}

export interface AliyunCaptchaOptions {
  SceneId: string
  EncryptedSceneId?: string
  mode: string
  element: string
  button: string
  success: CaptchaVerifyCallback
  fail?: (result: unknown) => void
  getInstance: (instance: CaptchaInstance) => void
  slideStyle?: { width: number; height: number }
  language?: string
  timeout?: number
  rem?: number
  autoRefresh?: boolean
  immediate?: boolean
  onError?: (error: Error) => void
}
