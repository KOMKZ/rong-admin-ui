<script lang="ts" setup>
  import RSectionCard from './RSectionCard.vue'

  const props = defineProps({
    dataTestid: { type: String, default: undefined },
  })
</script>

<template>
  <!--
    一级页面 Tab 的唯一 Surface：负责白色内容面、边框和 flush 容器。
    这里只提供布局边界，NTabs/NTabPane 及业务状态仍由消费页面持有。

    使用约束：
    - Page/Detail 根级 Tab 使用 RPageTabs，禁止把 NTabs 直接放在 RPage 灰底上。
    - 卡片、表单、弹窗和列表内部的局部 Tab 不使用本组件，继续留在所属 Panel。
    - 不在业务页面复制 page-tabs 背景、边框或 padding CSS。
  -->
  <RSectionCard class="r-page-tabs" flush :data-testid="props.dataTestid">
    <slot />
  </RSectionCard>
</template>
