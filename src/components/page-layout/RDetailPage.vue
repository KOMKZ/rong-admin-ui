<script lang="ts" setup>
  import RPage from './RPage.vue'

  const props = defineProps({
    dataTestid: { type: String, default: undefined },
  })
</script>

<template>
  <RPage class="r-detail-page" :data-testid="props.dataTestid">
    <slot />
  </RPage>
</template>
