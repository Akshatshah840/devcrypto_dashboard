/**
 * DaisyUI Theme Configuration
 * Single source of truth for all theme-related constants
 */

// All available DaisyUI themes (32 themes)
export const THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro',
  'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel',
  'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'
] as const;

// Type for valid themes
export type ThemeName = typeof THEMES[number];

// Default theme
export const DEFAULT_THEME: ThemeName = 'light';

// Theme preview colors (primary, secondary, accent, neutral) for visual preview
// These match DaisyUI's actual theme colors
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  base: string;
  isDark: boolean;
}

export const THEME_COLORS: Record<ThemeName, ThemeColors> = {
  light: { primary: '#570df8', secondary: '#f000b8', accent: '#37cdbe', neutral: '#3d4451', base: '#ffffff', isDark: false },
  dark: { primary: '#661ae6', secondary: '#d926aa', accent: '#1fb2a5', neutral: '#2a323c', base: '#1d232a', isDark: true },
  cupcake: { primary: '#65c3c8', secondary: '#ef9fbc', accent: '#eeaf3a', neutral: '#291334', base: '#faf7f5', isDark: false },
  bumblebee: { primary: '#e0a82e', secondary: '#f9d72f', accent: '#181830', neutral: '#181830', base: '#ffffff', isDark: false },
  emerald: { primary: '#66cc8a', secondary: '#377cfb', accent: '#ea5234', neutral: '#333c4d', base: '#ffffff', isDark: false },
  corporate: { primary: '#4b6bfb', secondary: '#7b92b2', accent: '#67cba0', neutral: '#181a2a', base: '#ffffff', isDark: false },
  synthwave: { primary: '#e779c1', secondary: '#58c7f3', accent: '#f3cc30', neutral: '#20134e', base: '#1a103d', isDark: true },
  retro: { primary: '#ef9995', secondary: '#a4cbb4', accent: '#dc8850', neutral: '#7d7259', base: '#e4d8b4', isDark: false },
  cyberpunk: { primary: '#ff7598', secondary: '#75d1f0', accent: '#c07eec', neutral: '#423f00', base: '#ffee00', isDark: false },
  valentine: { primary: '#e96d7b', secondary: '#a991f7', accent: '#88dbdd', neutral: '#af4670', base: '#f0d6e8', isDark: false },
  halloween: { primary: '#f28c18', secondary: '#6d3a9c', accent: '#51a800', neutral: '#212121', base: '#212121', isDark: true },
  garden: { primary: '#5c7f67', secondary: '#ecf4e7', accent: '#fae5e5', neutral: '#5d5656', base: '#e9e7e7', isDark: false },
  forest: { primary: '#1eb854', secondary: '#1db990', accent: '#1db9ac', neutral: '#19362d', base: '#171212', isDark: true },
  aqua: { primary: '#09ecf3', secondary: '#966fb3', accent: '#ffe999', neutral: '#345da7', base: '#345da7', isDark: true },
  lofi: { primary: '#0d0d0d', secondary: '#1a1a1a', accent: '#262626', neutral: '#000000', base: '#ffffff', isDark: false },
  pastel: { primary: '#d1c1d7', secondary: '#f6cbd1', accent: '#b4e9d6', neutral: '#70acc7', base: '#ffffff', isDark: false },
  fantasy: { primary: '#6e0b75', secondary: '#007ebd', accent: '#f8860d', neutral: '#1f2937', base: '#ffffff', isDark: false },
  wireframe: { primary: '#b8b8b8', secondary: '#b8b8b8', accent: '#b8b8b8', neutral: '#ebebeb', base: '#ffffff', isDark: false },
  black: { primary: '#343232', secondary: '#343232', accent: '#343232', neutral: '#272626', base: '#000000', isDark: true },
  luxury: { primary: '#ffffff', secondary: '#152747', accent: '#513448', neutral: '#171618', base: '#09090b', isDark: true },
  dracula: { primary: '#ff79c6', secondary: '#bd93f9', accent: '#ffb86c', neutral: '#414558', base: '#282a36', isDark: true },
  cmyk: { primary: '#45AEEE', secondary: '#E8488A', accent: '#FFF232', neutral: '#1a1a1a', base: '#ffffff', isDark: false },
  autumn: { primary: '#8C0327', secondary: '#D85251', accent: '#D59B6A', neutral: '#826A5C', base: '#f1f1f1', isDark: false },
  business: { primary: '#1C4E80', secondary: '#7C909A', accent: '#EA6947', neutral: '#23282E', base: '#202020', isDark: true },
  acid: { primary: '#FF00F4', secondary: '#FF7400', accent: '#CBFD03', neutral: '#1B1D1D', base: '#141414', isDark: true },
  lemonade: { primary: '#519903', secondary: '#E9E92E', accent: '#F7F9CA', neutral: '#191A3E', base: '#ffffff', isDark: false },
  night: { primary: '#38bdf8', secondary: '#818cf8', accent: '#f471b5', neutral: '#1e293b', base: '#0f172a', isDark: true },
  coffee: { primary: '#DB924B', secondary: '#6F4E37', accent: '#10576D', neutral: '#120C12', base: '#20161F', isDark: true },
  winter: { primary: '#047AFF', secondary: '#463AA2', accent: '#C148AC', neutral: '#021431', base: '#ffffff', isDark: false },
  dim: { primary: '#9FE88D', secondary: '#FF7D5C', accent: '#C792E9', neutral: '#1c212b', base: '#2A303C', isDark: true },
  nord: { primary: '#5E81AC', secondary: '#81A1C1', accent: '#88C0D0', neutral: '#4C566A', base: '#ECEFF4', isDark: false },
  sunset: { primary: '#FF865B', secondary: '#FD6F9C', accent: '#B387FA', neutral: '#2F2944', base: '#1A1626', isDark: true },
};

// Theme categories for better organization in UI
export const THEME_CATEGORIES = {
  light: ['light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'garden', 'lofi', 'pastel', 'fantasy', 'wireframe', 'cmyk', 'autumn', 'lemonade', 'winter', 'nord'],
  dark: ['dark', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'forest', 'aqua', 'black', 'luxury', 'dracula', 'business', 'acid', 'night', 'coffee', 'dim', 'sunset']
} as const;

// Popular/featured themes for quick access
export const POPULAR_THEMES: ThemeName[] = ['light', 'dark', 'corporate', 'synthwave', 'nord', 'dracula'];

// Theme display names (if different from id)
export const THEME_DISPLAY_NAMES: Partial<Record<ThemeName, string>> = {
  lofi: 'Lo-Fi',
  cmyk: 'CMYK'
};

// Get display name for a theme
export const getThemeDisplayName = (theme: ThemeName): string => {
  return THEME_DISPLAY_NAMES[theme] || theme.charAt(0).toUpperCase() + theme.slice(1);
};

// Get theme preview colors
export const getThemeColors = (theme: ThemeName): ThemeColors => {
  return THEME_COLORS[theme];
};
