<script lang="ts" setup>
import { ref, type PropType } from 'vue'
import { NCollapseTransition, NSpace, NText } from 'naive-ui'

const props = defineProps({
  title: { type: String, required: true },
  defaultExpanded: { type: Boolean, default: false },
  icon: { type: String as PropType<string>, default: undefined },
  badge: { type: [String, Number], default: undefined },
  bordered: { type: Boolean, default: true },
})

const expanded = ref(props.defaultExpanded)

function toggle() {
  expanded.value = !expanded.value
}

defineExpose({ expanded, toggle })
</script>

<template>
  <div :class="['r-collapsible-panel', { 'r-collapsible-panel--bordered': bordered }]">
    <div class="r-collapsible-panel__header" @click="toggle">
      <NSpace :size="6" align="center">
        <span :class="['r-collapsible-panel__arrow', { 'r-collapsible-panel__arrow--open': expanded }]">▶</span>
        <NText strong style="font-size: 13px">{{ title }}</NText>
        <NText v-if="badge !== undefined" depth="3" style="font-size: 11px">({{ badge }})</NText>
      </NSpace>
    </div>
    <NCollapseTransition :show="expanded">
      <div class="r-collapsible-panel__body">
        <slot />
      </div>
    </NCollapseTransition>
  </div>
</template>

<style scoped>
.r-collapsible-panel {
  border-radius: 6px;
  overflow: hidden;
}
.r-collapsible-panel--bordered {
  border: 1px solid var(--n-border-color, #e0e0e6);
}
.r-collapsible-panel__header {
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  background: var(--n-color-embedded, #fafafc);
  transition: background 0.2s;
}
.r-collapsible-panel__header:hover {
  background: var(--n-color-hover, #f0f0f5);
}
.r-collapsible-panel__arrow {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
  color: var(--n-text-color3, #999);
}
.r-collapsible-panel__arrow--open {
  transform: rotate(90deg);
}
.r-collapsible-panel__body {
  padding: 12px;
}
</style>
