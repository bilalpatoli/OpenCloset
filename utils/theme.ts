import { Platform } from 'react-native';

export const colors = {
  accent: '#6F7F8C',
  accentDark: '#4F5A65',
  background: '#FAFAFA',
  surface: '#F5F5F5',
  surfaceHover: '#EDEDED',
  text: '#1A1A1A',
  textSecondary: '#616161',
  textTertiary: '#8A8A8A',
  border: '#E0E0E0',
  borderSoft: '#EDEDED',
  danger: '#B3443A',
  success: '#4F6B5C',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// export const colors = {
//   accent: '#A69080',
//   accentDark: '#8A7566',
//   background: '#FAFAFA',
//   surface: '#F5F2F0',
//   surfaceHover: '#EBE6E1',
//   text: '#211F1E',
//   textSecondary: '#6B6662',
//   textTertiary: '#A39E9A',
//   border: '#E6E1DD',
//   borderSoft: '#F5F2F0',
//   danger: '#B3443A',
//   success: '#7D8C7D',
//   white: '#FFFFFF',
//   black: '#000000',
// } as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }),
} as const;

export const shadow = {
  soft: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;
