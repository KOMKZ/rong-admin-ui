<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'

const props = defineProps<{ params?: any }>()

const displayName = ref('')
const isIdColumn = ref(false)
let agParams: any = null

function init(params: any) {
  agParams = params
  if (params) {
    displayName.value = params.displayName || ''
    isIdColumn.value = params.column?.getColId() === 'id'
  }
}

onMounted(() => { if (props.params) init(props.params) })

function handleEdit() {
  const p = agParams || props.params
  if (p?.context?.editColumn) p.context.editColumn(p.column?.getColId())
}

function handleDelete() {
  const p = agParams || props.params
  if (p?.context?.deleteColumn) p.context.deleteColumn(p.column?.getColId())
}

function refresh(params: any) {
  if (params) {
    agParams = params
    displayName.value = params.displayName || ''
    isIdColumn.value = params.column?.getColId() === 'id'
  }
  return true
}

function destroy() { agParams = null }
onBeforeUnmount(destroy)

defineExpose({ init, refresh, destroy })
</script>

<template>
  <div class="rdg-custom-header">
    <span class="rdg-custom-header__text">{{ displayName }}</span>
    <div v-if="!isIdColumn" class="rdg-custom-header__actions">
      <button class="rdg-custom-header__btn" title="编辑列" @click.stop="handleEdit">
        <Pencil :size="13" />
      </button>
      <button class="rdg-custom-header__btn rdg-custom-header__btn--danger" title="删除列" @click.stop="handleDelete">
        <Trash2 :size="13" />
      </button>
    </div>
  </div>
</template>

<style>
.rdg-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0 4px;
}

.rdg-custom-header__text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rdg-custom-header__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.rdg-custom-header:hover .rdg-custom-header__actions {
  opacity: 1;
}

.rdg-custom-header__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--ra-color-brand-primary, #0969da);
  cursor: pointer;
  transition: all 0.12s;
  padding: 0;
}

.rdg-custom-header__btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}

.rdg-custom-header__btn--danger {
  color: var(--ra-color-danger, #cf222e);
}
</style>
