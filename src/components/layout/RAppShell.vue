<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  sidebarCollapsed: { type: Boolean, default: false },
  sidebarWidth: { type: Number, default: 220 },
  collapsedWidth: { type: Number, default: 64 },
  headerHeight: { type: Number, default: 56 },
  headerFixed: { type: Boolean, default: true },
  footerVisible: { type: Boolean, default: false },
  footerHeight: { type: Number, default: 48 },
})

const emit = defineEmits<{
  'update:sidebarCollapsed': [collapsed: boolean]
}>()

const isMobile = ref(false)
const mobileOpen = ref(false)

function checkMobile(): void {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth < 768
  if (isMobile.value && !wasMobile) {
    emit('update:sidebarCollapsed', true)
    mobileOpen.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const currentSidebarWidth = computed(() =>
  isMobile.value ? 0 : (props.sidebarCollapsed ? props.collapsedWidth : props.sidebarWidth),
)

const mainStyle = computed(() => ({
  marginLeft: `${currentSidebarWidth.value}px`,
}))

const sidebarStyle = computed(() => ({
  width: isMobile.value
    ? (mobileOpen.value ? `${props.sidebarWidth}px` : '0px')
    : (props.sidebarCollapsed ? `${props.collapsedWidth}px` : `${props.sidebarWidth}px`),
  position: isMobile.value ? 'fixed' as const : 'fixed' as const,
}))

function toggleMobileSidebar(): void {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value
  } else {
    emit('update:sidebarCollapsed', !props.sidebarCollapsed)
  }
}
</script>

<template>
  <div class="r-app-shell" data-testid="app-shell">
    <!-- Mobile overlay -->
    <div
      v-if="isMobile && mobileOpen"
      class="r-app-shell__overlay"
      @click="mobileOpen = false"
    />

    <!-- Sidebar slot -->
    <div
      class="r-app-shell__sidebar"
      :style="sidebarStyle"
    >
      <slot name="sidebar" :collapsed="sidebarCollapsed" :toggle="toggleMobileSidebar" />
    </div>

    <!-- Main area -->
    <div class="r-app-shell__main" :style="mainStyle">
      <!-- Header slot -->
      <div
        class="r-app-shell__header"
        :class="{ 'r-app-shell__header--fixed': headerFixed }"
        :style="{ height: `${headerHeight}px` }"
      >
        <slot name="header" :toggle-sidebar="toggleMobileSidebar" />
      </div>

      <!-- Tabs slot -->
      <div v-if="$slots.tabs" class="r-app-shell__tabs">
        <slot name="tabs" />
      </div>

      <!-- Content area -->
      <div class="r-app-shell__content">
        <slot />
      </div>

      <!-- Footer -->
      <div
        v-if="footerVisible && $slots.footer"
        class="r-app-shell__footer"
        :style="{ height: `${footerHeight}px` }"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-app-shell {
  min-height: 100vh;
  background: var(--ra-color-bg-page);
}
.r-app-shell__overlay {
  position: fixed;
  inset: 0;
  background: var(--ra-color-bg-overlay);
  z-index: 99;
}
.r-app-shell__sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: width var(--ra-transition-base);
  overflow: hidden;
}
.r-app-shell__main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--ra-transition-base);
}
.r-app-shell__header {
  flex-shrink: 0;
  z-index: 50;
}
.r-app-shell__header--fixed {
  position: sticky;
  top: 0;
}
.r-app-shell__tabs {
  flex-shrink: 0;
}
.r-app-shell__content {
  flex: 1;
  padding: var(--ra-spacing-4);
  overflow: auto;
}
.r-app-shell__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--ra-color-border-default);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}
</style>
