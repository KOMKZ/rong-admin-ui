<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import { NModal, NCard, NButton, NSpace, NSpin } from 'naive-ui'
import type { ModalPreset, ModalDialogExpose } from './types'

const props = defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: undefined },
  preset: { type: String as PropType<ModalPreset>, default: 'dialog' },
  width: { type: [Number, String] as PropType<number | string>, default: 520 },
  closable: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  positiveText: { type: String, default: '确认' },
  negativeText: { type: String, default: '取消' },
  showFooter: { type: Boolean, default: true },
  autoFocus: { type: Boolean, default: true },
  trapFocus: { type: Boolean, default: true },
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  confirm: []
  cancel: []
  afterOpen: []
  afterClose: []
}>()

const showModal = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

function handleClose(): void {
  emit('update:visible', false)
  emit('cancel')
}

function handleConfirm(): void {
  emit('confirm')
}

function handleAfterEnter(): void {
  emit('afterOpen')
}

function handleAfterLeave(): void {
  emit('afterClose')
}

function handleMaskClick(): void {
  if (props.maskClosable) handleClose()
}

function handleEsc(): void {
  if (props.closeOnEsc) handleClose()
}

const expose: ModalDialogExpose = {
  open: () => emit('update:visible', true),
  close: () => {
    emit('update:visible', false)
    emit('cancel')
  },
}

defineExpose(expose)
</script>

<template>
  <NModal
    v-model:show="showModal"
    :auto-focus="autoFocus"
    :trap-focus="trapFocus"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    @after-enter="handleAfterEnter"
    @after-leave="handleAfterLeave"
    @mask-click="handleMaskClick"
    @esc="handleEsc"
  >
    <NCard
      :title="title"
      :closable="closable"
      :style="{ width: typeof width === 'number' ? `${width}px` : width }"
      :bordered="false"
      role="dialog"
      :aria-modal="true"
      :aria-label="title"
      @close="handleClose"
    >
      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>

      <template v-if="$slots.icon" #header-extra>
        <slot name="icon" />
      </template>

      <NSpin :show="loading">
        <slot />
      </NSpin>

      <template v-if="showFooter" #footer>
        <slot name="footer">
          <NSpace justify="end">
            <NButton @click="handleClose">{{ negativeText }}</NButton>
            <NButton type="primary" :loading="loading" :disabled="loading" @click="handleConfirm">
              {{ positiveText }}
            </NButton>
          </NSpace>
        </slot>
      </template>
    </NCard>
  </NModal>
</template>
