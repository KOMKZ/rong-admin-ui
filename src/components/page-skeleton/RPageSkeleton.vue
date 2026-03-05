<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import type { SkeletonMode } from './types'

const props = defineProps({
  mode: { type: String as PropType<SkeletonMode>, required: true },
  rows: { type: Number, default: 6 },
  animated: { type: Boolean, default: true },
  columns: { type: Number, default: 4 },
  showHeader: { type: Boolean, default: true },
  showToolbar: { type: Boolean, default: true },
  showPagination: { type: Boolean, default: true },
})

const skeletonClass = computed(() => [
  'r-page-skeleton',
  `r-page-skeleton--${props.mode}`,
  { 'r-page-skeleton--animated': props.animated },
])
</script>

<template>
  <div :class="skeletonClass" :data-testid="`page-skeleton-${mode}`">
    <!-- List skeleton -->
    <template v-if="mode === 'list'">
      <div v-if="showHeader" class="r-skel__header">
        <div class="r-skel__bar r-skel__bar--title" />
        <div class="r-skel__bar r-skel__bar--action" />
      </div>
      <div v-if="showToolbar" class="r-skel__toolbar">
        <div class="r-skel__bar r-skel__bar--filter" />
        <div class="r-skel__bar r-skel__bar--filter-short" />
        <div class="r-skel__bar r-skel__bar--button" />
      </div>
      <div class="r-skel__table">
        <div class="r-skel__table-header">
          <div v-for="c in columns" :key="c" class="r-skel__bar r-skel__bar--cell" />
        </div>
        <div v-for="r in rows" :key="r" class="r-skel__table-row">
          <div v-for="c in columns" :key="c" class="r-skel__bar r-skel__bar--cell" />
        </div>
      </div>
      <div v-if="showPagination" class="r-skel__pagination">
        <div class="r-skel__bar r-skel__bar--page" />
      </div>
    </template>

    <!-- Detail skeleton -->
    <template v-else-if="mode === 'detail'">
      <div v-if="showHeader" class="r-skel__header">
        <div class="r-skel__bar r-skel__bar--back" />
        <div class="r-skel__bar r-skel__bar--title" />
        <div class="r-skel__bar r-skel__bar--action" />
      </div>
      <div class="r-skel__detail-section">
        <div class="r-skel__bar r-skel__bar--section-title" />
        <div class="r-skel__detail-grid">
          <div v-for="r in rows" :key="r" class="r-skel__detail-pair">
            <div class="r-skel__bar r-skel__bar--label" />
            <div class="r-skel__bar r-skel__bar--value" />
          </div>
        </div>
      </div>
      <div class="r-skel__detail-section">
        <div class="r-skel__bar r-skel__bar--section-title" />
        <div class="r-skel__detail-grid">
          <div v-for="r in Math.ceil(rows / 2)" :key="r" class="r-skel__detail-pair">
            <div class="r-skel__bar r-skel__bar--label" />
            <div class="r-skel__bar r-skel__bar--value" />
          </div>
        </div>
      </div>
    </template>

    <!-- Form skeleton -->
    <template v-else-if="mode === 'form'">
      <div v-if="showHeader" class="r-skel__header">
        <div class="r-skel__bar r-skel__bar--title" />
      </div>
      <div class="r-skel__form">
        <div v-for="r in rows" :key="r" class="r-skel__form-field">
          <div class="r-skel__bar r-skel__bar--label" />
          <div class="r-skel__bar r-skel__bar--input" />
        </div>
      </div>
      <div class="r-skel__form-actions">
        <div class="r-skel__bar r-skel__bar--button" />
        <div class="r-skel__bar r-skel__bar--button" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.r-page-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-5);
  padding: var(--ra-spacing-4);
}

.r-skel__bar {
  background: var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  height: 12px;
}

.r-page-skeleton--animated .r-skel__bar {
  animation: skel-pulse 1.5s ease-in-out infinite;
}

@keyframes skel-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.r-skel__bar--title { width: 200px; height: 24px; }
.r-skel__bar--action { width: 80px; height: 32px; margin-left: auto; }
.r-skel__bar--back { width: 32px; height: 32px; border-radius: var(--ra-radius-md); }
.r-skel__bar--filter { width: 160px; height: 32px; }
.r-skel__bar--filter-short { width: 120px; height: 32px; }
.r-skel__bar--button { width: 72px; height: 32px; border-radius: var(--ra-radius-md); }
.r-skel__bar--cell { flex: 1; height: 16px; }
.r-skel__bar--page { width: 200px; height: 28px; margin-left: auto; }
.r-skel__bar--section-title { width: 150px; height: 18px; margin-bottom: var(--ra-spacing-3); }
.r-skel__bar--label { width: 80px; height: 14px; }
.r-skel__bar--value { width: 160px; height: 14px; }
.r-skel__bar--input { flex: 1; height: 36px; border-radius: var(--ra-radius-md); }

.r-skel__header {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}
.r-skel__toolbar {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}
.r-skel__table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  overflow: hidden;
}
.r-skel__table-header {
  display: flex;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  background: var(--ra-color-bg-page);
}
.r-skel__table-row {
  display: flex;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-4);
  border-top: 1px solid var(--ra-color-border-default);
}
.r-skel__pagination {
  display: flex;
  justify-content: flex-end;
}
.r-skel__detail-section {
  padding: var(--ra-spacing-4);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
}
.r-skel__detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ra-spacing-4) var(--ra-spacing-6);
}
.r-skel__detail-pair {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
}
.r-skel__form {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-5);
  padding: var(--ra-spacing-6);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
}
.r-skel__form-field {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-4);
}
.r-skel__form-actions {
  display: flex;
  gap: var(--ra-spacing-3);
  justify-content: flex-end;
}
</style>
