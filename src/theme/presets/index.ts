import type { GlobalThemeOverrides } from 'naive-ui'
import type { ThemePreset, ThemePresetName } from '../types'

const ADMIN_RADIUS = '0px'

function withAdminShapeGovernance(overrides: GlobalThemeOverrides): GlobalThemeOverrides {
  return {
    ...overrides,
    common: {
      ...overrides.common,
      borderRadius: ADMIN_RADIUS,
      borderRadiusSmall: ADMIN_RADIUS,
    },
    Button: {
      ...overrides.Button,
      borderRadiusTiny: ADMIN_RADIUS,
      borderRadiusSmall: ADMIN_RADIUS,
      borderRadiusMedium: ADMIN_RADIUS,
      borderRadiusLarge: ADMIN_RADIUS,
    },
    Card: {
      ...overrides.Card,
      borderRadius: ADMIN_RADIUS,
      closeBorderRadius: ADMIN_RADIUS,
    },
    Dialog: {
      ...overrides.Dialog,
      borderRadius: ADMIN_RADIUS,
      closeBorderRadius: ADMIN_RADIUS,
    },
    Drawer: {
      ...overrides.Drawer,
      borderRadius: ADMIN_RADIUS,
      closeBorderRadius: ADMIN_RADIUS,
    },
    Dropdown: {
      ...overrides.Dropdown,
      borderRadius: ADMIN_RADIUS,
      borderRadiusSubmenu: ADMIN_RADIUS,
    },
    Input: {
      ...overrides.Input,
      borderRadius: ADMIN_RADIUS,
    },
    InputNumber: {
      ...overrides.InputNumber,
      peers: {
        ...overrides.InputNumber?.peers,
        Input: {
          ...overrides.InputNumber?.peers?.Input,
          borderRadius: ADMIN_RADIUS,
        },
      },
    },
    InternalSelection: {
      ...overrides.InternalSelection,
      borderRadius: ADMIN_RADIUS,
    },
    Modal: {
      ...overrides.Modal,
      borderRadius: ADMIN_RADIUS,
    },
    Popconfirm: {
      ...overrides.Popconfirm,
      borderRadius: ADMIN_RADIUS,
    },
    Popover: {
      ...overrides.Popover,
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function blueNaiveLight(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#2080f0',
      primaryColorHover: '#1a6dd4',
      primaryColorPressed: '#155ab8',
      primaryColorSuppl: '#4a9cff',
      successColor: '#18a058',
      warningColor: '#f0a020',
      errorColor: '#d03050',
      bodyColor: '#fafbfc',
      cardColor: '#ffffff',
      borderColor: '#eef0f2',
      textColorBase: '#1a202c',
      textColor1: '#1a202c',
      textColor2: '#4a5568',
      textColor3: '#6b7785',
      borderRadius: ADMIN_RADIUS,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    },
  }
}

function blueNaiveDark(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#4a9cff',
      primaryColorHover: '#7ab8ff',
      primaryColorPressed: '#2080f0',
      primaryColorSuppl: '#aed4ff',
      successColor: '#34d399',
      warningColor: '#fbbf24',
      errorColor: '#f87171',
      bodyColor: '#111318',
      cardColor: '#1a1d24',
      borderColor: '#2e333d',
      textColorBase: '#e8eaed',
      textColor1: '#e8eaed',
      textColor2: '#9aa0aa',
      textColor3: '#6b7280',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function tealNaiveLight(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#14b8a6',
      primaryColorHover: '#0f9688',
      primaryColorPressed: '#0d7a6f',
      primaryColorSuppl: '#2dd4bf',
      successColor: '#18a058',
      warningColor: '#f0a020',
      errorColor: '#d03050',
      bodyColor: '#f7fafa',
      cardColor: '#ffffff',
      borderColor: '#d5e0df',
      textColorBase: '#1a2b2a',
      textColor1: '#1a2b2a',
      textColor2: '#4a6968',
      textColor3: '#7a9594',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function tealNaiveDark(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#2dd4bf',
      primaryColorHover: '#5eead4',
      primaryColorPressed: '#14b8a6',
      primaryColorSuppl: '#99f6e4',
      successColor: '#34d399',
      warningColor: '#fbbf24',
      errorColor: '#f87171',
      bodyColor: '#0d1514',
      cardColor: '#141d1c',
      borderColor: '#2a3d3b',
      textColorBase: '#e0edec',
      textColor1: '#e0edec',
      textColor2: '#8aaba9',
      textColor3: '#5e807e',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function graphiteNaiveLight(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#5856d6',
      primaryColorHover: '#4a48c4',
      primaryColorPressed: '#3d3bb2',
      primaryColorSuppl: '#7b79e8',
      successColor: '#18a058',
      warningColor: '#f0a020',
      errorColor: '#d03050',
      bodyColor: '#f4f4f6',
      cardColor: '#ffffff',
      borderColor: '#d8d8dc',
      textColorBase: '#1c1c1e',
      textColor1: '#1c1c1e',
      textColor2: '#636366',
      textColor3: '#8e8e93',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function graphiteNaiveDark(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#7b79e8',
      primaryColorHover: '#9b99f0',
      primaryColorPressed: '#5856d6',
      primaryColorSuppl: '#a5a3e8',
      successColor: '#34d399',
      warningColor: '#fbbf24',
      errorColor: '#f87171',
      bodyColor: '#0e0e10',
      cardColor: '#161618',
      borderColor: '#2c2c30',
      textColorBase: '#e5e5ea',
      textColor1: '#e5e5ea',
      textColor2: '#8e8e93',
      textColor3: '#636366',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function cloudOpsNaiveLight(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#0891b2',
      primaryColorHover: '#0e7490',
      primaryColorPressed: '#155e75',
      primaryColorSuppl: '#22d3ee',
      successColor: '#059669',
      warningColor: '#d97706',
      errorColor: '#dc2626',
      bodyColor: '#f4f7f9',
      cardColor: '#ffffff',
      borderColor: '#e2e8f0',
      textColorBase: '#0f172a',
      textColor1: '#0f172a',
      textColor2: '#475569',
      textColor3: '#64748b',
      borderRadius: ADMIN_RADIUS,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  }
}

function cloudOpsNaiveDark(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#22d3ee',
      primaryColorHover: '#67e8f9',
      primaryColorPressed: '#06b6d4',
      primaryColorSuppl: '#a5f3fc',
      successColor: '#34d399',
      warningColor: '#fbbf24',
      errorColor: '#f87171',
      bodyColor: '#0c1222',
      cardColor: '#131b2e',
      borderColor: '#1e3a5f',
      textColorBase: '#f1f5f9',
      textColor1: '#f1f5f9',
      textColor2: '#94a3b8',
      textColor3: '#64748b',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function slateProNaiveLight(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#7c3aed',
      primaryColorHover: '#6d28d9',
      primaryColorPressed: '#5b21b6',
      primaryColorSuppl: '#a78bfa',
      successColor: '#059669',
      warningColor: '#d97706',
      errorColor: '#dc2626',
      bodyColor: '#f8f9fa',
      cardColor: '#ffffff',
      borderColor: '#e5e7eb',
      textColorBase: '#111827',
      textColor1: '#111827',
      textColor2: '#374151',
      textColor3: '#6b7280',
      borderRadius: ADMIN_RADIUS,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  }
}

function slateProNaiveDark(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#a78bfa',
      primaryColorHover: '#c4b5fd',
      primaryColorPressed: '#8b5cf6',
      primaryColorSuppl: '#ddd6fe',
      successColor: '#34d399',
      warningColor: '#fbbf24',
      errorColor: '#f87171',
      bodyColor: '#0f0f12',
      cardColor: '#18181c',
      borderColor: '#2d2d35',
      textColorBase: '#f9fafb',
      textColor1: '#f9fafb',
      textColor2: '#d1d5db',
      textColor3: '#9ca3af',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

function hirezySoftNaiveLight(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#6b93f5',
      primaryColorHover: '#5a82e8',
      primaryColorPressed: '#4b72da',
      primaryColorSuppl: '#8fa8f8',
      successColor: '#4bb889',
      warningColor: '#e2a040',
      errorColor: '#e45c6e',
      bodyColor: '#f4f6fa',
      cardColor: '#ffffff',
      borderColor: '#e2e6f0',
      textColorBase: '#1e2235',
      textColor1: '#1e2235',
      textColor2: '#4a5068',
      textColor3: '#6e7389',
      borderRadius: ADMIN_RADIUS,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    },
  }
}

function hirezySoftNaiveDark(): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: '#8fa8f8',
      primaryColorHover: '#a8bcf9',
      primaryColorPressed: '#7b93f0',
      primaryColorSuppl: '#b8c8fa',
      successColor: '#5fd4a0',
      warningColor: '#f0b856',
      errorColor: '#f07580',
      bodyColor: '#14162a',
      cardColor: '#1b1d32',
      borderColor: '#2a2d48',
      textColorBase: '#f0f1f7',
      textColor1: '#f0f1f7',
      textColor2: '#b8bbcc',
      textColor3: '#8589a0',
      borderRadius: ADMIN_RADIUS,
    },
  }
}

export const themePresets: Record<ThemePresetName, { light: ThemePreset; dark: ThemePreset }> = {
  'enterprise-blue': {
    light: {
      name: 'enterprise-blue',
      label: 'Enterprise Blue',
      mode: 'light',
      cssClass: 'ra-theme-enterprise-blue',
      naiveOverrides: withAdminShapeGovernance(blueNaiveLight()),
    },
    dark: {
      name: 'enterprise-blue',
      label: 'Enterprise Blue',
      mode: 'dark',
      cssClass: 'ra-theme-enterprise-blue ra-dark',
      naiveOverrides: withAdminShapeGovernance(blueNaiveDark()),
    },
  },
  'teal-ops': {
    light: {
      name: 'teal-ops',
      label: 'Teal Ops',
      mode: 'light',
      cssClass: 'ra-theme-teal-ops',
      naiveOverrides: withAdminShapeGovernance(tealNaiveLight()),
    },
    dark: {
      name: 'teal-ops',
      label: 'Teal Ops',
      mode: 'dark',
      cssClass: 'ra-theme-teal-ops ra-dark',
      naiveOverrides: withAdminShapeGovernance(tealNaiveDark()),
    },
  },
  'graphite-pro': {
    light: {
      name: 'graphite-pro',
      label: 'Graphite Pro',
      mode: 'light',
      cssClass: 'ra-theme-graphite-pro',
      naiveOverrides: withAdminShapeGovernance(graphiteNaiveLight()),
    },
    dark: {
      name: 'graphite-pro',
      label: 'Graphite Pro',
      mode: 'dark',
      cssClass: 'ra-theme-graphite-pro ra-dark',
      naiveOverrides: withAdminShapeGovernance(graphiteNaiveDark()),
    },
  },
  'cloud-ops': {
    light: {
      name: 'cloud-ops',
      label: 'Cloud Ops',
      mode: 'light',
      cssClass: 'ra-theme-cloud-ops',
      naiveOverrides: withAdminShapeGovernance(cloudOpsNaiveLight()),
    },
    dark: {
      name: 'cloud-ops',
      label: 'Cloud Ops',
      mode: 'dark',
      cssClass: 'ra-theme-cloud-ops ra-dark',
      naiveOverrides: withAdminShapeGovernance(cloudOpsNaiveDark()),
    },
  },
  'slate-pro': {
    light: {
      name: 'slate-pro',
      label: 'Slate Pro',
      mode: 'light',
      cssClass: 'ra-theme-slate-pro',
      naiveOverrides: withAdminShapeGovernance(slateProNaiveLight()),
    },
    dark: {
      name: 'slate-pro',
      label: 'Slate Pro',
      mode: 'dark',
      cssClass: 'ra-theme-slate-pro ra-dark',
      naiveOverrides: withAdminShapeGovernance(slateProNaiveDark()),
    },
  },
  'hirezy-soft': {
    light: {
      name: 'hirezy-soft',
      label: 'Hirezy Soft',
      mode: 'light',
      cssClass: 'ra-theme-hirezy-soft',
      naiveOverrides: withAdminShapeGovernance(hirezySoftNaiveLight()),
    },
    dark: {
      name: 'hirezy-soft',
      label: 'Hirezy Soft',
      mode: 'dark',
      cssClass: 'ra-theme-hirezy-soft ra-dark',
      naiveOverrides: withAdminShapeGovernance(hirezySoftNaiveDark()),
    },
  },
}

export function getPreset(name: ThemePresetName, mode: 'light' | 'dark'): ThemePreset {
  return themePresets[name][mode]
}

export function getPresetNames(): ThemePresetName[] {
  return Object.keys(themePresets) as ThemePresetName[]
}
