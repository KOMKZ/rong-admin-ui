<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import type { MenuItem } from '../../app-layout/types'
import { RIcon } from '../icon'

const props = defineProps({
  menus: { type: Array as PropType<MenuItem[]>, required: true },
  collapsed: { type: Boolean, default: false },
  activeKey: { type: String, default: '' },
  logo: { type: String, default: '' },
  title: { type: String, default: 'Admin' },
  collapsedWidth: { type: Number, default: 64 },
  expandedWidth: { type: Number, default: 240 },
})

const emit = defineEmits<{
  select: [key: string]
  'update:collapsed': [collapsed: boolean]
}>()

const sidebarStyle = computed(() => ({
  width: `${props.collapsed ? props.collapsedWidth : props.expandedWidth}px`,
}))

const visibleMenus = computed(() => props.menus.filter((m) => !m.hidden))

function handleSelect(key: string): void {
  emit('select', key)
}

function isActive(item: MenuItem): boolean {
  if (item.key === props.activeKey) return true
  return item.children?.some((c) => c.key === props.activeKey) ?? false
}
</script>

<template>
  <aside
    class="r-side-nav"
    :class="{ 'r-side-nav--collapsed': collapsed }"
    :style="sidebarStyle"
    data-testid="side-nav"
    role="navigation"
    aria-label="Sidebar navigation"
  >
    <div class="r-side-nav__brand">
      <img v-if="logo" :src="logo" alt="" class="r-side-nav__logo" />
      <span v-if="!collapsed" class="r-side-nav__title">{{ title }}</span>
    </div>

    <nav class="r-side-nav__menu">
      <ul role="menubar">
        <template v-for="item in visibleMenus" :key="item.key">
          <li
            v-if="!item.children?.length"
            class="r-side-nav__item"
            :class="{ 'r-side-nav__item--active': isActive(item) }"
            role="none"
          >
            <button
              role="menuitem"
              class="r-side-nav__link"
              :title="collapsed ? item.label : undefined"
              :aria-current="isActive(item) ? 'page' : undefined"
              @click="handleSelect(item.key)"
            >
              <RIcon v-if="typeof item.icon === 'string'" :name="item.icon" size="sm" class="r-side-nav__icon" />
              <span v-if="!collapsed" class="r-side-nav__label">{{ item.label }}</span>
            </button>
          </li>
          <li
            v-else
            class="r-side-nav__group"
            :class="{ 'r-side-nav__group--active': isActive(item) }"
            role="none"
          >
            <span v-if="!collapsed" class="r-side-nav__group-label">{{ item.label }}</span>
            <ul role="group">
              <li
                v-for="child in item.children.filter((c: MenuItem) => !c.hidden)"
                :key="child.key"
                class="r-side-nav__item"
                :class="{ 'r-side-nav__item--active': child.key === activeKey }"
                role="none"
              >
                <button
                  role="menuitem"
                  class="r-side-nav__link r-side-nav__link--child"
                  :title="collapsed ? child.label : undefined"
                  :aria-current="child.key === activeKey ? 'page' : undefined"
                  @click="handleSelect(child.key)"
                >
                  <RIcon v-if="typeof child.icon === 'string'" :name="child.icon" size="sm" class="r-side-nav__icon" />
                  <span v-if="!collapsed" class="r-side-nav__label">{{ child.label }}</span>
                </button>
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </nav>

    <div class="r-side-nav__footer">
      <button
        class="r-side-nav__collapse-btn"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="emit('update:collapsed', !collapsed)"
      >
        <RIcon :name="collapsed ? 'chevrons-right' : 'chevrons-left'" size="sm" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.r-side-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--ra-color-bg-surface);
  border-right: 1px solid var(--ra-color-border-light);
  transition: width var(--ra-transition-base);
  overflow: hidden;
  flex-shrink: 0;
}

.r-side-nav__brand {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-4) var(--ra-spacing-5);
  height: var(--ra-topbar-height);
  border-bottom: 1px solid var(--ra-color-border-light);
  flex-shrink: 0;
}

.r-side-nav__logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--ra-radius-md);
}

.r-side-nav__title {
  font-size: var(--ra-font-size-lg);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: var(--ra-letter-spacing-tight);
}

.r-side-nav__menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--ra-spacing-3) var(--ra-spacing-2);
}

.r-side-nav__menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.r-side-nav__group-label {
  display: block;
  padding: var(--ra-spacing-4) var(--ra-spacing-3) var(--ra-spacing-2);
  font-size: var(--ra-font-size-2xs);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: var(--ra-letter-spacing-wider);
}

.r-side-nav__link {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  width: 100%;
  margin: var(--ra-spacing-0-5) 0;
  padding: var(--ra-spacing-2-5) var(--ra-spacing-3);
  background: transparent;
  border: none;
  cursor: pointer;
  font: inherit;
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-text-secondary);
  text-align: left;
  white-space: nowrap;
  border-radius: var(--ra-radius-md);
  transition: all var(--ra-transition-fast);
}

.r-side-nav__link:hover {
  background: var(--ra-color-bg-hover);
  color: var(--ra-color-text-primary);
}

.r-side-nav__link:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: -2px;
}

.r-side-nav__link--child {
  padding-left: var(--ra-spacing-10);
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-normal);
}

.r-side-nav__item--active > .r-side-nav__link {
  color: var(--ra-color-brand-primary);
  background: var(--ra-color-brand-subtle);
  font-weight: var(--ra-font-weight-semibold);
}

.r-side-nav__item--active > .r-side-nav__link:hover {
  background: var(--ra-color-brand-light);
}

.r-side-nav__icon {
  flex-shrink: 0;
  opacity: 0.85;
}

.r-side-nav__item--active .r-side-nav__icon {
  opacity: 1;
}

.r-side-nav__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-side-nav--collapsed .r-side-nav__brand {
  justify-content: center;
  padding: var(--ra-spacing-4) var(--ra-spacing-2);
}

.r-side-nav--collapsed .r-side-nav__link {
  justify-content: center;
  padding: var(--ra-spacing-2-5);
  margin: var(--ra-spacing-1) var(--ra-spacing-2);
}

.r-side-nav--collapsed .r-side-nav__link--child {
  padding-left: var(--ra-spacing-2-5);
}

.r-side-nav__footer {
  border-top: 1px solid var(--ra-color-border-light);
  padding: var(--ra-spacing-3);
  flex-shrink: 0;
}

.r-side-nav__collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--ra-spacing-2);
  background: transparent;
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-md);
  cursor: pointer;
  color: var(--ra-color-text-tertiary);
  transition: all var(--ra-transition-fast);
}

.r-side-nav__collapse-btn:hover {
  background: var(--ra-color-bg-hover);
  color: var(--ra-color-text-primary);
  border-color: var(--ra-color-border-default);
}

.r-side-nav__collapse-btn:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}
</style>
