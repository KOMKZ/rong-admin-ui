<template>
  <div>
    <div :id="buttonId" :style="buttonStyle">
      <slot>
        <span>{{ buttonText }}</span>
      </slot>
    </div>
    <div :id="elementId"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import type {
  CaptchaConfig,
  CaptchaVerifyCallback,
  CaptchaBizResultCallback,
  CaptchaInstance,
} from './types'

const props = withDefaults(
  defineProps<{
    config: CaptchaConfig
    uniqueId?: string
    buttonText?: string
    onVerify: CaptchaVerifyCallback
    onBizResult?: CaptchaBizResultCallback
  }>(),
  {
    uniqueId: 'default',
    buttonText: '点击验证',
  },
)

const emit = defineEmits<{
  ready: [instance: CaptchaInstance]
}>()

const captchaInstance = ref<CaptchaInstance | null>(null)
const buttonId = computed(() => `ra-captcha-btn-${props.uniqueId}`)
const elementId = computed(() => `ra-captcha-el-${props.uniqueId}`)

const buttonStyle = {
  display: 'none',
}

function getInstance(instance: CaptchaInstance) {
  captchaInstance.value = instance
  emit('ready', instance)
}

function cleanup() {
  document.getElementById('aliyunCaptcha-mask')?.remove()
  document.getElementById('aliyunCaptcha-window-popup')?.remove()
}

onMounted(() => {
  if (!props.config.enabled) return

  if (typeof window.initAliyunCaptcha !== 'function') {
    console.warn('[RaCaptcha] Aliyun Captcha SDK not loaded')
    return
  }

  window.initAliyunCaptcha({
    SceneId: props.config.sceneId,
    prefix: props.config.prefix,
    mode: props.config.mode || 'popup',
    element: `#${elementId.value}`,
    button: `#${buttonId.value}`,
    captchaVerifyCallback: props.onVerify,
    onBizResultCallback: props.onBizResult || (() => {}),
    getInstance,
    slideStyle: props.config.slideStyle || { width: 360, height: 40 },
    language: props.config.language || 'cn',
  })
})

onBeforeUnmount(() => {
  cleanup()
  captchaInstance.value = null
})

function trigger() {
  const btn = document.getElementById(buttonId.value)
  btn?.click()
}

defineExpose({ trigger, instance: captchaInstance })
</script>
