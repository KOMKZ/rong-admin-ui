<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import type { MenuItem } from '../../app-layout/types'

const props = defineProps({
  menus: { type: Array as PropType<MenuItem[]>, required: true },
  collapsed: { type: Boolean, default: false },
  activeKey: { type: String, default: '' },
  logo: { type: String, default: '' },
  title: { type: String, default: 'Admin' },
  collapsedWidth: { type: Number, default: 64 },
  expandedWidth: { type: Number, default: 220 },
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
              <span v-if="item.icon" class="r-side-nav__icon">{{ item.icon }}</span>
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
                  <span v-if="child.icon" class="r-side-nav__icon">{{ child.icon }}</span>
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
        <span class="r-side-nav__collapse-icon" :class="{ rotated: collapsed }">&#9664;</span>
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
  border-right: 1px solid var(--ra-color-border-default);
  transition: width var(--ra-transition-base);
  overflow: hidden;
  flex-shrink: 0;
}
.r-side-nav__brand {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-4);
  height: 56px;
  border-bottom: 1px solid var(--ra-color-border-light);
  flex-shrink: 0;
}
.r-side-nav__logo {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.r-side-nav__title {
  font-size: var(--ra-font-size-lg);
  font-weight: 700;
  color: var(--ra-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
}
.r-side-nav__menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--ra-spacing-2) 0;
}
.r-side-nav__menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.r-side-nav__group-label {
  display: block;
  padding: var(--ra-spacing-3) var(--ra-spacing-4) var(--ra-spacing-1);
  font-size: 11px;
  font-weight: 600;
  color: var(--ra-color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.r-side-nav__link {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  width: 100%;
  padding: var(--ra-spacing-2) var(--ra-spacing-4);
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  font-size: var(--ra-font-size-base);
  color: var(--ra-color-text-secondary);
  text-align: left;
  white-space: nowrap;
  border-radius: 0;
  transition: all var(--ra-transition-fast);
}
.r-side-nav__link:hover {
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-primary);
}
.r-side-nav__link:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: -2px;
}
.r-side-nav__link--child {
  padding-left: var(--ra-spacing-10);
  font-size: var(--ra-font-size-sm);
}
.r-side-nav__item--active > .r-side-nav__link {
  color: var(--ra-color-brand-primary);
  background: var(--ra-color-brand-light);
  font-weight: 500;
}
.r-side-nav__icon {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  font-size: 16px;
}
.r-side-nav__label {
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-side-nav--collapsed .r-side-nav__link {
  justify-content: center;
  padding: var(--ra-spacing-2) 0;
}
.r-side-nav--collapsed .r-side-nav__link--child {
  padding-left: 0;
}
.r-side-nav__footer {
  border-top: 1px solid var(--ra-color-border-light);
  padding: var(--ra-spacing-2);
  flex-shrink: 0;
}
.r-side-nav__collapse-btn {
  width: 100%;
  padding: var(--ra-spacing-2);
  background: none;
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-sm);
  cursor: pointer;
  color: var(--ra-color-text-tertiary);
  transition: all var(--ra-transition-fast);
}
.r-side-nav__collapse-btn:hover {
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-primary);
}
.r-side-nav__collapse-btn:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}
.r-side-nav__collapse-icon {
  display: inline-block;
  transition: transform var(--ra-transition-fast);
  font-size: 12px;
}
.r-side-nav__collapse-icon.rotated {
  transform: rotate(180deg);
}
</style>
