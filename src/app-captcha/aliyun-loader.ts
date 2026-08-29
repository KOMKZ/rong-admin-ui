import type { AliyunCaptchaGlobalConfig } from './types'

export const DEFAULT_ALIYUN_CAPTCHA_SCRIPT_URL =
  'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'

export interface LoadAliyunCaptchaOptions {
  prefix: string
  region?: AliyunCaptchaGlobalConfig['region']
  scriptUrl?: string
  timeoutMs?: number
}

let loadingPromise: Promise<void> | null = null
let loadedKey = ''

export function loadAliyunCaptcha(options: LoadAliyunCaptchaOptions): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Aliyun CAPTCHA can only be loaded in browser runtime'))
  }

  const prefix = options.prefix.trim()
  if (!prefix) {
    return Promise.reject(new Error('Aliyun CAPTCHA prefix is required'))
  }

  const region = options.region ?? 'cn'
  const scriptUrl = options.scriptUrl || DEFAULT_ALIYUN_CAPTCHA_SCRIPT_URL
  const timeoutMs = options.timeoutMs ?? 8000
  const key = `${region}:${prefix}:${scriptUrl}`

  window.AliyunCaptchaConfig = { region, prefix }

  if (typeof window.initAliyunCaptcha === 'function') {
    loadedKey = key
    return Promise.resolve()
  }

  if (loadingPromise && loadedKey === key) {
    return loadingPromise
  }

  loadedKey = key
  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-ra-captcha-sdk="aliyun"][src="${scriptUrl}"]`,
    )
    if (existing) {
      if (typeof window.initAliyunCaptcha === 'function') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Aliyun CAPTCHA SDK load failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.defer = true
    script.dataset.raCaptchaSdk = 'aliyun'

    const timer = window.setTimeout(() => {
      reject(new Error('Aliyun CAPTCHA SDK load timed out'))
    }, timeoutMs)

    script.addEventListener(
      'load',
      () => {
        window.clearTimeout(timer)
        if (typeof window.initAliyunCaptcha !== 'function') {
          reject(new Error('Aliyun CAPTCHA SDK initialized without initAliyunCaptcha'))
          return
        }
        resolve()
      },
      { once: true },
    )
    script.addEventListener(
      'error',
      () => {
        window.clearTimeout(timer)
        reject(new Error('Aliyun CAPTCHA SDK load failed'))
      },
      { once: true },
    )

    document.head.appendChild(script)
  }).catch((error) => {
    loadingPromise = null
    throw error
  })

  return loadingPromise
}
