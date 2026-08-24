<script lang="ts" setup>
  import type { PropType } from 'vue'
  import type { PageTone } from './types'

  const props = defineProps({
    dataTestid: { type: String, default: undefined },
    tone: { type: String as PropType<PageTone>, default: 'default' },
  })
</script>

<template>
  <section class="ra-page r-page" :class="`r-page--${props.tone}`" :data-testid="props.dataTestid">
    <slot />
  </section>
</template>

<style scoped>
  .r-page {
    min-width: 0;
  }

  .r-page--plain {
    gap: 0;
  }
</style>
