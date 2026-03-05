import type { GlobalThemeOverrides } from 'naive-ui'
import type { ThemePreset, ThemePresetName } from '../types'

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
      borderRadius: '6px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
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
      borderRadius: '6px',
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
      borderRadius: '6px',
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
      borderRadius: '6px',
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
      borderRadius: '6px',
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
      borderRadius: '6px',
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
      naiveOverrides: blueNaiveLight(),
    },
    dark: {
      name: 'enterprise-blue',
      label: 'Enterprise Blue',
      mode: 'dark',
      cssClass: 'ra-theme-enterprise-blue ra-dark',
      naiveOverrides: blueNaiveDark(),
    },
  },
  'teal-ops': {
    light: {
      name: 'teal-ops',
      label: 'Teal Ops',
      mode: 'light',
      cssClass: 'ra-theme-teal-ops',
      naiveOverrides: tealNaiveLight(),
    },
    dark: {
      name: 'teal-ops',
      label: 'Teal Ops',
      mode: 'dark',
      cssClass: 'ra-theme-teal-ops ra-dark',
      naiveOverrides: tealNaiveDark(),
    },
  },
  'graphite-pro': {
    light: {
      name: 'graphite-pro',
      label: 'Graphite Pro',
      mode: 'light',
      cssClass: 'ra-theme-graphite-pro',
      naiveOverrides: graphiteNaiveLight(),
    },
    dark: {
      name: 'graphite-pro',
      label: 'Graphite Pro',
      mode: 'dark',
      cssClass: 'ra-theme-graphite-pro ra-dark',
      naiveOverrides: graphiteNaiveDark(),
    },
  },
}

export function getPreset(name: ThemePresetName, mode: 'light' | 'dark'): ThemePreset {
  return themePresets[name][mode]
}

export function getPresetNames(): ThemePresetName[] {
  return Object.keys(themePresets) as ThemePresetName[]
}
