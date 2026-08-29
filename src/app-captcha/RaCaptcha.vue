<template>
  <div class="ra-captcha" :data-status="status">
    <div :id="buttonId" class="ra-captcha__button">
      <slot>
        <span>{{ buttonText }}</span>
      </slot>
    </div>
    <div :id="elementId" class="ra-captcha__element"></div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { loadAliyunCaptcha } from './aliyun-loader'
  import type {
    CaptchaConfig,
    CaptchaErrorCallback,
    CaptchaInstance,
    CaptchaSceneTokenLoader,
    CaptchaStatus,
    CaptchaVerifyCallback,
  } from './types'

  const props = withDefaults(
    defineProps<{
      config: CaptchaConfig
      uniqueId?: string
      buttonText?: string
      sceneTokenLoader: CaptchaSceneTokenLoader
      onVerify: CaptchaVerifyCallback
      onError?: CaptchaErrorCallback
    }>(),
    {
      uniqueId: 'default',
      buttonText: '点击验证',
    },
  )

  const emit = defineEmits<{
    ready: [instance: CaptchaInstance]
    error: [error: Error]
  }>()

  const captchaInstance = ref<CaptchaInstance | null>(null)
  const status = ref<CaptchaStatus>(props.config.enabled ? 'loading' : 'disabled')
  const buttonId = computed(() => `ra-captcha-btn-${props.uniqueId}`)
  const elementId = computed(() => `ra-captcha-el-${props.uniqueId}`)
  let readyPromise: Promise<void> | null = null

  function getInstance(instance: CaptchaInstance) {
    captchaInstance.value = instance
    status.value = 'ready'
    emit('ready', instance)
  }

  function cleanup() {
    document.getElementById('aliyunCaptcha-mask')?.remove()
    document.getElementById('aliyunCaptcha-window-popup')?.remove()
  }

  async function initialize() {
    if (!props.config.enabled) {
      status.value = 'disabled'
      return
    }
    if (readyPromise) return readyPromise

    status.value = 'loading'
    readyPromise = initAliyunCaptcha().catch((error: unknown) => {
      const normalized = error instanceof Error ? error : new Error(String(error))
      status.value = 'error'
      props.onError?.(normalized)
      emit('error', normalized)
      throw normalized
    })
    return readyPromise
  }

  async function initAliyunCaptcha() {
    if (props.config.provider !== 'aliyun') {
      throw new Error(`Unsupported CAPTCHA provider: ${props.config.provider}`)
    }

    const scene = props.config.scene.trim()
    if (!scene) {
      throw new Error('CAPTCHA scene is required')
    }

    await loadAliyunCaptcha({
      prefix: props.config.prefix,
      region: props.config.region,
      scriptUrl: props.config.scriptUrl,
      timeoutMs: props.config.timeout,
    })

    if (typeof window.initAliyunCaptcha !== 'function') {
      throw new Error('Aliyun CAPTCHA SDK is not available')
    }

    const sceneToken = await props.sceneTokenLoader(scene)
    if (!sceneToken.scene_id) {
      throw new Error('CAPTCHA scene id is empty')
    }
    if (!sceneToken.token) {
      throw new Error('CAPTCHA scene token is empty')
    }

    window.initAliyunCaptcha({
      SceneId: sceneToken.scene_id,
      EncryptedSceneId: sceneToken.token,
      mode: props.config.mode || 'popup',
      element: `#${elementId.value}`,
      button: `#${buttonId.value}`,
      success: props.onVerify,
      fail(error) {
        const normalized = error instanceof Error ? error : new Error(String(error))
        props.onError?.(normalized)
        emit('error', normalized)
      },
      getInstance,
      slideStyle: props.config.slideStyle || { width: 360, height: 40 },
      language: props.config.language || 'cn',
      timeout: props.config.timeout,
      rem: props.config.rem,
      autoRefresh: props.config.autoRefresh,
      immediate: props.config.immediate,
      onError(error) {
        const normalized = error instanceof Error ? error : new Error(String(error))
        status.value = 'error'
        props.onError?.(normalized)
        emit('error', normalized)
      },
    })
    if (status.value !== 'ready') {
      status.value = 'ready'
    }
  }

  onMounted(() => {
    void initialize().catch(() => {})
  })

  onBeforeUnmount(() => {
    cleanup()
    captchaInstance.value = null
  })

  async function trigger() {
    try {
      await initialize()
    } catch {
      return
    }
    if (status.value !== 'ready') return
    document.getElementById(buttonId.value)?.click()
  }

  function reset() {
    captchaInstance.value?.reset?.()
  }

  defineExpose({ trigger, reset, instance: captchaInstance, status })
</script>

<style scoped>
  .ra-captcha {
    display: contents;
  }

  .ra-captcha__button {
    display: none;
  }
</style>
