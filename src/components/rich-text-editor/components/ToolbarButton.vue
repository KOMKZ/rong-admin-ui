<script lang="ts" setup>
withDefaults(
  defineProps<{
    active?: boolean
    disabled?: boolean
    title?: string
  }>(),
  {
    active: false,
    disabled: false,
    title: '',
  },
)

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="rrte-toolbar-btn"
    :class="{ 'rrte-toolbar-btn--active': active }"
    :disabled="disabled"
    :title="title"
    :aria-pressed="active"
    type="button"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
.rrte-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: var(--ra-radius-md, 4px);
  background: transparent;
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  padding: 0;
}

.rrte-toolbar-btn:hover:not(:disabled) {
  background: var(--ra-color-bg-muted, #f3f4f6);
  color: var(--ra-color-text-primary, #24292f);
}

.rrte-toolbar-btn--active {
  background: var(--ra-color-brand-subtle, #dbeafe);
  color: var(--ra-color-brand-primary, #0969da);
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rrte-toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rrte-toolbar-btn:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring, #0969da);
  outline-offset: 1px;
}
</style>
