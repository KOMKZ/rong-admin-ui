<script lang="ts" setup>
import type { PropType } from 'vue'
import type { PropsTableRow } from './types'

defineProps({
  title: { type: String, default: 'Props' },
  rows: { type: Array as PropType<PropsTableRow[]>, required: true },
})
</script>

<template>
  <section class="r-props-table" data-testid="props-table">
    <h3 class="r-props-table__title">{{ title }}</h3>
    <div class="r-props-table__wrap">
      <table class="r-props-table__table" role="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name">
            <td>
              <code class="prop-name">{{ row.name }}</code>
            </td>
            <td>
              <code class="prop-type">{{ row.type }}</code>
            </td>
            <td>
              <code v-if="row.default !== undefined" class="prop-default">{{ row.default }}</code>
              <span v-else class="prop-none">—</span>
            </td>
            <td>
              <span v-if="row.required" class="badge badge--required">required</span>
              <span v-else class="badge badge--optional">optional</span>
            </td>
            <td class="prop-desc">{{ row.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.r-props-table {
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  overflow: hidden;
}
.r-props-table__title {
  font-size: var(--ra-font-size-base);
  font-weight: 600;
  color: var(--ra-color-text-primary);
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  margin: 0;
  background: var(--ra-color-bg-muted);
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-props-table__wrap {
  overflow-x: auto;
}
.r-props-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--ra-font-size-sm);
}
.r-props-table__table th {
  text-align: left;
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-secondary);
  font-weight: 600;
  font-size: var(--ra-font-size-xs);
  white-space: nowrap;
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-props-table__table td {
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  border-bottom: 1px solid var(--ra-color-border-light);
  vertical-align: top;
}
.prop-name {
  color: var(--ra-color-brand-primary);
  font-weight: 600;
  font-size: var(--ra-font-size-sm);
}
.prop-type {
  color: var(--ra-color-text-code);
  background: var(--ra-color-bg-code);
  padding: 1px 6px;
  border-radius: var(--ra-radius-sm);
  font-size: var(--ra-font-size-xs);
}
.prop-default {
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}
.prop-none {
  color: var(--ra-color-text-tertiary);
}
.prop-desc {
  color: var(--ra-color-text-secondary);
  line-height: var(--ra-line-height-base);
}
.badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: var(--ra-radius-sm);
  font-weight: 600;
}
.badge--required {
  background: var(--ra-color-danger-bg);
  color: var(--ra-color-danger);
}
.badge--optional {
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-tertiary);
}
</style>
