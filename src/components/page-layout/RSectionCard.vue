<script lang="ts" setup>
  const props = defineProps({
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    compact: { type: Boolean, default: false },
    flush: { type: Boolean, default: false },
    dataTestid: { type: String, default: undefined },
  })
</script>

<template>
  <section
    class="ra-card r-section-card"
    :class="{
      'ra-card--compact': props.compact,
      'ra-card--flush': props.flush,
    }"
    :data-testid="props.dataTestid"
  >
    <header v-if="props.title || props.description || $slots.extra" class="ra-card__header">
      <div>
        <h2 v-if="props.title" class="ra-card__title">{{ props.title }}</h2>
        <p v-if="props.description" class="r-section-card__description">{{ props.description }}</p>
      </div>
      <div v-if="$slots.extra" class="ra-card__extra">
        <slot name="extra" />
      </div>
    </header>
    <div class="ra-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
  .r-section-card {
    min-width: 0;
  }

  .r-section-card__description {
    margin: var(--ra-spacing-1, 4px) 0 0;
    color: var(--ra-color-text-tertiary);
    font-size: var(--ra-font-size-sm);
    line-height: var(--ra-line-height-base);
  }
</style>
