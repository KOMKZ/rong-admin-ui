<script lang="ts" setup>
  import { type PropType } from 'vue'
  import RPage from './RPage.vue'
  import RSectionCard from './RSectionCard.vue'
  import type { FormPageWidth } from './types'

  const props = defineProps({
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    width: { type: String as PropType<FormPageWidth>, default: 'medium' },
    dataTestid: { type: String, default: undefined },
    cardTestid: { type: String, default: undefined },
  })
</script>

<template>
  <RPage class="r-form-page" :data-testid="props.dataTestid">
    <RSectionCard
      class="r-form-page__card"
      :class="`r-form-page__card--${props.width}`"
      :title="props.title"
      :description="props.description"
      :data-testid="props.cardTestid"
    >
      <slot />
    </RSectionCard>
  </RPage>
</template>

<style scoped>
  .r-form-page__card {
    width: 100%;
  }

  .r-form-page__card--narrow {
    max-width: 480px;
  }

  .r-form-page__card--medium {
    max-width: 720px;
  }

  .r-form-page__card--wide {
    max-width: 960px;
  }

  .r-form-page__card--full {
    max-width: none;
  }
</style>
