<script lang="ts" setup>
  import { RouterLink } from 'vue-router'
  import { NButton } from 'naive-ui'
  import { resolveLinkRel } from '../navigation/link-rel'
  import type { RouteButtonProps } from './types'

  defineOptions({ inheritAttrs: false })

  const props = withDefaults(defineProps<RouteButtonProps>(), {
    target: '_self',
    replace: false,
    disabled: false,
  })

  const emit = defineEmits<{ navigate: [] }>()

  // `navigate` 事件只表示"应用内 SPA 导航即将发生"：
  // - 修饰键点击：浏览器原生开新标签，navigate(e) 不会 SPA 导航，不 emit；
  // - target="_blank"：根本不走 navigate，由 anchor 原生行为开新文档，也不 emit；
  // - 非左键（中键）：浏览器原生行为，click 不会带导航语义。
  function handleNavigate(event: MouseEvent, navigate: (event: MouseEvent) => void): void {
    if (props.target === '_blank') return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    navigate(event)
    if (event.button === undefined || event.button === 0) emit('navigate')
  }
</script>

<template>
  <RouterLink v-if="!disabled" custom :to="to" :replace="replace" v-slot="{ href, navigate }">
    <NButton
      tag="a"
      :href="href"
      :target="target"
      :rel="resolveLinkRel(target)"
      v-bind="$attrs"
      @click="handleNavigate($event, navigate)"
    >
      <slot />
    </NButton>
  </RouterLink>
  <NButton v-else disabled v-bind="$attrs">
    <slot />
  </NButton>
</template>
