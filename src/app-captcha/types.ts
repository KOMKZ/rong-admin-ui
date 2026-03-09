export interface CaptchaConfig {
  enabled: boolean
  provider: 'aliyun'
  sceneId: string
  prefix: string
  ekey?: string
  language?: 'cn' | 'tw' | 'en'
  mode?: 'popup' | 'embed'
  slideStyle?: { width: number; height: number }
}

export interface CaptchaVerifyResult {
  captchaResult: boolean
  bizResult?: boolean
}

export type CaptchaVerifyCallback = (captchaVerifyParam: string) => Promise<CaptchaVerifyResult>

export type CaptchaBizResultCallback = (bizResult: boolean) => void

export interface CaptchaInstance {
  reset: () => void
  show: () => void
  hide: () => void
}

declare global {
  interface Window {
    initAliyunCaptcha: (options: AliyunCaptchaOptions) => void
  }
}

export interface AliyunCaptchaOptions {
  SceneId: string
  prefix: string
  mode: string
  element: string
  button: string
  captchaVerifyCallback: CaptchaVerifyCallback
  onBizResultCallback: CaptchaBizResultCallback
  getInstance: (instance: CaptchaInstance) => void
  slideStyle?: { width: number; height: number }
  language?: string
  ekey?: string
}
