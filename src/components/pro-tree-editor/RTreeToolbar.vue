<script lang="ts" setup>
import { ref, computed, type PropType } from 'vue'
import { NInput, NButton, NSpace, NTooltip, NBadge } from 'naive-ui'
import RIcon from '../icon/RIcon.vue'
import type { TreeI18n, TreeBatchConfig } from './types'
import { DEFAULT_I18N } from './types'

const props = defineProps({
  i18n: { type: Object as PropType<TreeI18n>, default: () => ({}) },
  loading: { type: Boolean, default: false },
  keyword: { type: String, default: '' },
  selectable: { type: Boolean, default: false },
  batch: { type: [Object, Boolean] as PropType<TreeBatchConfig | false>, default: false },
  checkedCount: { type: Number, default: 0 },
  batchMode: { type: Boolean, default: false },
})

const emit = defineEmits<{
  'update:keyword': [value: string]
  expandAll: []
  collapseAll: []
  refresh: []
  create: []
  toggleBatchMode: []
  batchMove: []
  batchDelete: []
}>()

const t = computed(() => ({ ...DEFAULT_I18N, ...props.i18n }))
const localKeyword = ref(props.keyword)

function onSearchInput(value: string): void {
  localKeyword.value = value
  emit('update:keyword', value)
}
</script>

<template>
  <div class="rpte-toolbar" data-testid="tree-toolbar">
    <div class="rpte-toolbar__search">
      <NInput
        :value="localKeyword"
        :placeholder="t.search"
        clearable
        size="small"
        data-testid="tree-search-input"
        @update:value="onSearchInput"
      >
        <template #prefix>
          <RIcon name="search" :size="14" />
        </template>
      </NInput>
    </div>

    <div class="rpte-toolbar__actions">
      <slot name="toolbar-extra" />

      <NSpace :size="4" align="center">
        <NTooltip>
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              data-testid="tree-expand-all-btn"
              @click="emit('expandAll')"
            >
              <template #icon><RIcon name="chevrons-down" :size="14" /></template>
            </NButton>
          </template>
          {{ t.expandAll }}
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              data-testid="tree-collapse-all-btn"
              @click="emit('collapseAll')"
            >
              <template #icon><RIcon name="chevrons-up" :size="14" /></template>
            </NButton>
          </template>
          {{ t.collapseAll }}
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <NButton
              quaternary
              size="tiny"
              :loading="loading"
              data-testid="tree-refresh-btn"
              @click="emit('refresh')"
            >
              <template #icon><RIcon name="refresh-cw" :size="14" /></template>
            </NButton>
          </template>
          {{ t.refresh }}
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <NButton quaternary size="tiny" data-testid="tree-create-btn" @click="emit('create')">
              <template #icon><RIcon name="plus" :size="14" /></template>
            </NButton>
          </template>
          {{ t.newFolder }}
        </NTooltip>

        <template v-if="batch !== false && selectable">
          <NTooltip>
            <template #trigger>
              <NButton
                :type="batchMode ? 'primary' : 'default'"
                quaternary
                size="tiny"
                data-testid="tree-batch-btn"
                @click="emit('toggleBatchMode')"
              >
                <template #icon><RIcon name="check-square" :size="14" /></template>
              </NButton>
            </template>
            {{ t.batchSelect }}
          </NTooltip>
        </template>
      </NSpace>
    </div>

    <!-- Batch action bar -->
    <div v-if="batchMode && checkedCount > 0" class="rpte-toolbar__batch">
      <NBadge :value="checkedCount" :max="99" type="info">
        <span class="rpte-toolbar__batch-label">
          {{ (t.selected ?? '').replace('{count}', String(checkedCount)) }}
        </span>
      </NBadge>
      <NSpace :size="4">
        <NButton
          v-if="batch !== false && (batch as TreeBatchConfig)?.enableMove !== false"
          size="tiny"
          data-testid="tree-batch-move-btn"
          @click="emit('batchMove')"
        >
          <template #icon><RIcon name="move" :size="12" /></template>
          {{ t.batchMove }}
        </NButton>
        <NButton
          v-if="batch !== false && (batch as TreeBatchConfig)?.enableDelete !== false"
          size="tiny"
          type="error"
          data-testid="tree-batch-delete-btn"
          @click="emit('batchDelete')"
        >
          <template #icon><RIcon name="trash-2" :size="12" /></template>
          {{ t.batchDelete }}
        </NButton>
      </NSpace>
    </div>
  </div>
</template>

<style scoped>
.rpte-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
  padding-bottom: var(--ra-spacing-2);
  border-bottom: 1px solid var(--ra-color-border-light);
}
.rpte-toolbar__search {
  flex: 1;
}
.rpte-toolbar__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rpte-toolbar__batch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ra-spacing-1-5) var(--ra-spacing-2);
  background: var(--ra-color-brand-subtle);
  border-radius: var(--ra-radius-md);
  gap: var(--ra-spacing-2);
}
.rpte-toolbar__batch-label {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-secondary);
}
</style>
