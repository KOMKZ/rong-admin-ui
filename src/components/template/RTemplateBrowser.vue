<script lang="ts" setup>
import { computed } from 'vue'
import { NCard, NTag, NRate, NAvatar, NSpin, NEmpty } from 'naive-ui'
import type { RTemplateBrowserItem } from './types'

const props = withDefaults(
  defineProps<{
    templates: RTemplateBrowserItem[]
    loading?: boolean
    onSelect?: (item: RTemplateBrowserItem) => void
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  select: [item: RTemplateBrowserItem]
}>()

function parseTags(raw: RTemplateBrowserItem['tags']): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String)
  const s = String(raw).trim()
  if (!s) return []
  try {
    const j = JSON.parse(s) as unknown
    if (Array.isArray(j)) return j.map((x) => String(x)).filter(Boolean)
  } catch {
    /* ignore */
  }
  return s.split(/[,，]/).map((x) => x.trim()).filter(Boolean)
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

const list = computed(() => props.templates)

function handleCardClick(t: RTemplateBrowserItem) {
  emit('select', t)
  props.onSelect?.(t)
}
</script>

<template>
  <div class="rtemplate-browser">
    <NSpin :show="loading">
      <div v-if="list.length > 0" class="rtemplate-browser__grid">
        <NCard
          v-for="t in list"
          :key="t.id"
          class="rtemplate-browser__card"
          hoverable
          size="small"
          @click="handleCardClick(t)"
        >
          <div class="rtemplate-browser__head">
            <NAvatar round size="medium" class="rtemplate-browser__avatar">
              {{ t.name.charAt(0) }}
            </NAvatar>
            <div class="rtemplate-browser__meta">
              <div class="rtemplate-browser__title">{{ t.name }}</div>
              <NTag v-if="t.category" size="small" round>{{ t.category }}</NTag>
            </div>
          </div>
          <p class="rtemplate-browser__desc">{{ truncate(t.description || '', 120) }}</p>
          <div v-if="parseTags(t.tags).length" class="rtemplate-browser__tags">
            <NTag v-for="tag in parseTags(t.tags).slice(0, 4)" :key="tag" size="tiny" :bordered="false">
              {{ tag }}
            </NTag>
          </div>
          <div class="rtemplate-browser__footer">
            <NRate
              :value="t.avg_rating ?? 0"
              readonly
              allow-half
              size="small"
              :count="5"
            />
            <span class="rtemplate-browser__usage">{{ t.usage_count ?? 0 }} 次使用</span>
          </div>
        </NCard>
      </div>
      <NEmpty v-else description="暂无模板" />
    </NSpin>
  </div>
</template>

<style scoped>
.rtemplate-browser__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .rtemplate-browser__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .rtemplate-browser__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1440px) {
  .rtemplate-browser__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.rtemplate-browser__card {
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.rtemplate-browser__card:hover {
  transform: translateY(-2px);
}

.rtemplate-browser__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.rtemplate-browser__avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #6b93f5, #9b7cf0);
  color: #fff;
  font-weight: 600;
}

.rtemplate-browser__meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rtemplate-browser__title {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.3;
  color: var(--ra-color-text-primary, #1e2235);
}

.rtemplate-browser__desc {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ra-color-text-secondary, #5c6178);
  min-height: 3.9em;
}

.rtemplate-browser__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.rtemplate-browser__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--ra-color-border-light, #eef0f6);
}

.rtemplate-browser__usage {
  font-size: 12px;
  color: var(--ra-color-text-tertiary, #6e7389);
  white-space: nowrap;
}
</style>
