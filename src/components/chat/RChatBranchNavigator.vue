<script setup lang="ts">
import { NButton, NSpace } from 'naive-ui'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  hasPrev?: boolean
  hasNext?: boolean
  /** Current branch path label, e.g. "分支 2/3" */
  pathLabel?: string
}

withDefaults(defineProps<Props>(), {
  hasPrev: false,
  hasNext: false,
  pathLabel: '',
})

const emit = defineEmits<{
  (e: 'switch-branch', direction: 'prev' | 'next'): void
}>()

function emitPrev() {
  emit('switch-branch', 'prev')
}

function emitNext() {
  emit('switch-branch', 'next')
}
</script>

<template>
  <div class="r-chat-branch-nav">
    <NSpace align="center" :size="8">
      <NButton
        quaternary
        size="small"
        :disabled="!hasPrev"
        aria-label="上一个分支"
        @click="emitPrev"
      >
        <template #icon>
          <ChevronLeft :size="16" />
        </template>
      </NButton>
      <span v-if="pathLabel" class="r-chat-branch-nav__label">{{ pathLabel }}</span>
      <NButton
        quaternary
        size="small"
        :disabled="!hasNext"
        aria-label="下一个分支"
        @click="emitNext"
      >
        <template #icon>
          <ChevronRight :size="16" />
        </template>
      </NButton>
    </NSpace>
  </div>
</template>

<style scoped>
.r-chat-branch-nav {
  display: inline-flex;
  align-items: center;
}
.r-chat-branch-nav__label {
  font-size: 12px;
  color: var(--ra-color-text-3, #999);
}
</style>
