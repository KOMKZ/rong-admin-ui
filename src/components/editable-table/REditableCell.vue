<script lang="ts" setup generic="T extends Record<string, unknown> = Record<string, unknown>">
/**
 * REditableCell：可编辑单元格交互协议（ticket 000608 P1-07）。
 * 视图态展示值（超长截断摘要），点击/回车进入编辑态；Enter 确认、Esc 取消、blur 确认；
 * 错误态标红并把 message 放到 aria-describedby。不含任何业务字段，供列 render 使用。
 * 上游：表格工作台页面列定义；下游：无（叶子组件）。
 * 维护：新单元格类型先扩展 EditableCellType 再在此渲染，禁止在页面里自写编辑分支。
 */
  import { computed, ref, watch } from 'vue'
  import { NInput, NSelect } from 'naive-ui'
  import type { REditableCellEmits, REditableCellProps } from './types'

  const props = withDefaults(defineProps<REditableCellProps>(), {
    type: 'text',
    options: () => [],
    maxlength: undefined,
    placeholder: '',
    error: '',
    disabled: false,
  })

  const emit = defineEmits<REditableCellEmits>()

  const editing = ref(false)
  const draft = ref(props.value)

  watch(
    () => props.value,
    (next) => {
      if (!editing.value) draft.value = next
    },
  )

  const displayValue = computed(() => {
    if (props.type === 'select') {
      const matched = props.options.find((option) => String(option.value) === props.value)
      return matched ? matched.label : props.value
    }
    return props.value
  })

  const errorId = computed(() => (props.error ? `rcell-error-${Math.abs(hash(props.error))}` : undefined))

  function hash(text: string): number {
    let value = 0
    for (let i = 0; i < text.length; i += 1) {
      value = (value * 31 + text.charCodeAt(i)) | 0
    }
    return value
  }

  function enterEdit(): void {
    if (props.disabled) return
    draft.value = props.value
    editing.value = true
  }

  function commit(): void {
    if (!editing.value) return
    editing.value = false
    if (draft.value !== props.value) emit('commit', draft.value)
  }

  function cancel(): void {
    editing.value = false
    draft.value = props.value
    emit('cancel')
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && props.type !== 'textarea') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  defineExpose({ enterEdit, commit, cancel })
</script>

<template>
  <div
    class="r-editable-cell"
    :class="{ 'r-editable-cell--error': !!props.error, 'r-editable-cell--editing': editing }"
    :aria-invalid="props.error ? 'true' : undefined"
    :aria-describedby="errorId"
  >
    <template v-if="editing">
      <NSelect
        v-if="props.type === 'select'"
        v-model:value="draft"
        size="tiny"
        :options="props.options.map((o) => ({ label: o.label, value: String(o.value) }))"
        :disabled="props.disabled"
        @update:value="() => commit()"
        @keydown="onKeydown"
        @blur="commit"
      />
      <NInput
        v-else-if="props.type === 'textarea'"
        v-model:value="draft"
        type="textarea"
        size="tiny"
        :autosize="{ minRows: 3, maxRows: 10 }"
        :maxlength="props.maxlength"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        @keydown="onKeydown"
        @blur="commit"
      />
      <NInput
        v-else
        v-model:value="draft"
        size="tiny"
        :maxlength="props.maxlength"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        @keydown="onKeydown"
        @blur="commit"
      />
    </template>
    <template v-else>
      <div class="r-editable-cell__view" :title="displayValue" @click="enterEdit">
        {{ displayValue || props.placeholder || '　' }}
      </div>
      <div v-if="props.error" :id="errorId" class="r-editable-cell__error" role="alert">
        {{ props.error }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.r-editable-cell {
  min-height: 28px;
}

.r-editable-cell__view {
  cursor: text;
  padding: 2px 4px;
  border-radius: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 22px;
}

.r-editable-cell__view:hover {
  background: var(--n-color-target, rgba(0, 0, 0, 0.04));
}

.r-editable-cell--error .r-editable-cell__view {
  color: #d03050;
  text-decoration: underline wavy #d03050;
}

.r-editable-cell__error {
  color: #d03050;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 2px;
}
</style>
