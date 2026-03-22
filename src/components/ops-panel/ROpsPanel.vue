<template>
  <n-tabs v-model:value="tab" type="line" animated class="r-ops-panel">
    <slot />
  </n-tabs>
</template>

<script setup lang="ts">
import { NTabs } from 'naive-ui'

const tab = defineModel<string>('tab', { required: true })
</script>
