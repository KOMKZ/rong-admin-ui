<script lang="ts" setup>
  import { computed } from 'vue'
  import { formatMinorMoney } from './format'

  const props = withDefaults(
    defineProps<{
      value?: number | null
      currency?: string
      scale?: number
      emptyText?: string
      showCurrency?: boolean
      currencyPosition?: 'prefix' | 'suffix'
    }>(),
    {
      value: null,
      currency: 'CNY',
      scale: 2,
      emptyText: '-',
      showCurrency: true,
      currencyPosition: 'prefix',
    },
  )

  const text = computed(() =>
    formatMinorMoney(props.value, {
      currency: props.currency,
      scale: props.scale,
      emptyText: props.emptyText,
      showCurrency: props.showCurrency,
      currencyPosition: props.currencyPosition,
    }),
  )
</script>

<template>
  <span class="r-money-text" data-testid="money-text">{{ text }}</span>
</template>

<style scoped>
  .r-money-text {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
</style>
