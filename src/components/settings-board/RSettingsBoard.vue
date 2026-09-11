<script setup lang="ts">
  import { computed } from 'vue'
  import { NButton, NSpace, NTabPane, NTabs } from 'naive-ui'
  import RFormRenderer from '../form-renderer/RFormRenderer.vue'
  import { RIcon } from '../icon'
  import type { SettingsBoardEmits, SettingsBoardProps, SettingsBoardTab } from './types'

  const props = withDefaults(defineProps<SettingsBoardProps>(), {
    description: '',
    activeTab: '',
    loading: false,
    saving: false,
    statusText: '',
    savedAtText: '',
    cols: 2,
  })

  const emit = defineEmits<SettingsBoardEmits>()

  const currentTabKey = computed(() => props.activeTab || props.tabs[0]?.key || '')

  const currentTab = computed(
    () =>
      props.tabs.find((tab) => tab.key === currentTabKey.value) ??
      props.tabs[0] ??
      null,
  )

  const hasSettings = computed(() => Boolean(currentTab.value?.cards.length))

  function handleTabChange(value: string | number): void {
    emit('update:activeTab', String(value))
  }

  function handleModelUpdate(model: Record<string, unknown>): void {
    emit('update:model', model)
  }

  function emitReset(tab: SettingsBoardTab | null): void {
    if (tab) emit('reset', tab)
  }

  function emitSave(tab: SettingsBoardTab | null): void {
    if (tab) emit('save', tab)
  }
</script>

<template>
  <section class="r-settings-board" data-testid="settings-board">
    <header class="r-settings-board__hero">
      <div class="r-settings-board__hero-main">
        <span class="r-settings-board__hero-icon">
          <RIcon name="settings" size="xl" color="brand" />
        </span>
        <div>
          <h1>{{ title }}</h1>
          <p v-if="description">{{ description }}</p>
        </div>
      </div>
      <div class="r-settings-board__hero-aside">
        <strong>稳定 · 安全 · 高效</strong>
        <span>让管理更简单，让业务更强大</span>
      </div>
    </header>

    <NTabs
      :value="currentTabKey"
      type="line"
      animated
      class="r-settings-board__tabs"
      @update:value="handleTabChange"
    >
      <NTabPane
        v-for="tab in tabs"
        :key="tab.key"
        :name="tab.key"
        :tab="tab.title"
      />
    </NTabs>

    <div v-if="hasSettings && currentTab" class="r-settings-board__grid">
      <article
        v-for="card in currentTab.cards"
        :key="card.key"
        class="r-settings-card"
        data-testid="settings-board-card"
      >
        <header class="r-settings-card__header">
          <span class="r-settings-card__icon">
            <RIcon :name="card.icon || 'settings'" size="md" color="brand" />
          </span>
          <div>
            <h2>{{ card.title }}</h2>
            <p v-if="card.description">{{ card.description }}</p>
          </div>
        </header>

        <RFormRenderer
          class="r-settings-card__form"
          :schema="card.fields"
          :model="model"
          :cols="cols"
          :row-gap="10"
          :column-gap="16"
          label-placement="top"
          :disabled="saving || loading"
          :show-feedback="true"
          :show-actions="false"
          @update:model="handleModelUpdate"
        />
      </article>
    </div>

    <div v-else class="r-settings-board__empty" data-testid="settings-board-empty">
      <span class="r-settings-board__empty-icon">
        <RIcon name="settings" size="xl" color="brand" />
      </span>
      <h2>暂无设置项</h2>
      <p>当前命名空间还没有可管理的系统设置。新增代码种子后会自动展示在这里。</p>
    </div>

    <footer v-if="hasSettings" class="r-settings-board__footer">
      <div class="r-settings-board__status">
        <span class="r-settings-board__status-dot" />
        <span>{{ statusText || '系统设置可编辑' }}</span>
        <span v-if="savedAtText" class="r-settings-board__saved-at">
          {{ savedAtText }}
        </span>
      </div>
      <NSpace>
        <NButton :disabled="saving || loading" @click="emit('refresh')">刷新</NButton>
        <NButton :disabled="saving || loading" @click="emitReset(currentTab)">重置</NButton>
        <NButton
          type="primary"
          :loading="saving"
          :disabled="loading"
          @click="emitSave(currentTab)"
        >
          保存
        </NButton>
      </NSpace>
    </footer>
  </section>
</template>

<style scoped>
  .r-settings-board {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: calc(100vh - 180px);
  }

  .r-settings-board__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ra-spacing-5, 20px);
    min-height: 104px;
    padding: var(--ra-spacing-5, 20px) var(--ra-spacing-6, 24px);
    border: 1px solid var(--ra-color-border-light, #eef0f6);
    border-radius: var(--ra-radius-sm, 4px);
    background:
      linear-gradient(90deg, rgba(47, 107, 255, 0.08), rgba(47, 107, 255, 0)),
      var(--ra-color-bg-card, #fff);
  }

  .r-settings-board__hero-main {
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-4, 16px);
    min-width: 0;
  }

  .r-settings-board__hero-icon,
  .r-settings-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: var(--ra-radius-sm, 4px);
    background: rgba(47, 107, 255, 0.1);
  }

  .r-settings-board__hero h1 {
    margin: 0;
    color: var(--ra-color-text-primary, #1e2235);
    font-size: 24px;
    font-weight: 650;
    line-height: 1.25;
  }

  .r-settings-board__hero p,
  .r-settings-board__hero-aside span,
  .r-settings-card__header p,
  .r-settings-board__saved-at {
    margin: 6px 0 0;
    color: var(--ra-color-text-tertiary, #6e7389);
    font-size: var(--ra-font-size-sm, 13px);
    line-height: var(--ra-line-height-base, 1.5);
  }

  .r-settings-board__hero-aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 180px;
    color: var(--ra-color-brand-primary, #2f6bff);
  }

  .r-settings-board__tabs {
    padding: 0 var(--ra-spacing-4, 16px);
    border-bottom: 1px solid var(--ra-color-border-light, #eef0f6);
  }

  .r-settings-board__grid {
    flex: 1;
    display: grid;
    align-content: start;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--ra-spacing-4, 16px);
    padding: var(--ra-spacing-4, 16px) 0 var(--ra-spacing-6, 24px);
  }

  .r-settings-card {
    min-width: 0;
    padding: var(--ra-spacing-4, 16px);
    border: 1px solid var(--ra-color-border-light, #eef0f6);
    border-radius: var(--ra-radius-sm, 4px);
    background: var(--ra-color-bg-card, #fff);
  }

  .r-settings-card__header {
    display: flex;
    align-items: flex-start;
    gap: var(--ra-spacing-3, 12px);
    margin-bottom: var(--ra-spacing-4, 16px);
  }

  .r-settings-card__header h2 {
    margin: 0;
    color: var(--ra-color-text-primary, #1e2235);
    font-size: 16px;
    font-weight: 650;
    line-height: 1.35;
  }

  .r-settings-card__form :deep(.n-form-item) {
    margin-bottom: 0;
  }

  .r-settings-board__footer {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ra-spacing-4, 16px);
    padding: var(--ra-spacing-3, 12px) 0 0;
    border-top: 1px solid var(--ra-color-border-light, #eef0f6);
    background: var(--ra-color-bg-page, #f7f8fb);
  }

  .r-settings-board__empty {
    flex: 1;
    display: flex;
    min-height: 360px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--ra-spacing-3, 12px);
    margin-top: var(--ra-spacing-4, 16px);
    border: 1px dashed var(--ra-color-border, #d8deea);
    border-radius: var(--ra-radius-sm, 4px);
    background: var(--ra-color-bg-card, #fff);
    color: var(--ra-color-text-secondary, #4d5368);
    text-align: center;
  }

  .r-settings-board__empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: var(--ra-radius-sm, 4px);
    background: rgba(47, 107, 255, 0.1);
  }

  .r-settings-board__empty h2 {
    margin: 0;
    color: var(--ra-color-text-primary, #1e2235);
    font-size: 18px;
    font-weight: 650;
  }

  .r-settings-board__empty p {
    max-width: 420px;
    margin: 0;
    color: var(--ra-color-text-tertiary, #6e7389);
    font-size: var(--ra-font-size-sm, 13px);
    line-height: var(--ra-line-height-base, 1.5);
  }

  .r-settings-board__status {
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-2, 8px);
    color: var(--ra-color-success, #18a058);
    font-size: var(--ra-font-size-sm, 13px);
  }

  .r-settings-board__status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
  }

  @media (max-width: 760px) {
    .r-settings-board__hero,
    .r-settings-board__footer {
      align-items: stretch;
      flex-direction: column;
    }

    .r-settings-board__hero-aside {
      align-items: flex-start;
    }

    .r-settings-board__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
