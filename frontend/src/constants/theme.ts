export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  cardHover: string;
  cardBorder: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  accentSky: string;
  accentPurple: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  divider: string;
  white: string;
  black: string;
  shadowColor: string;
  statusBar: 'light' | 'dark';
}

export const DarkColors: ThemeColors = {
  background: '#0A0F1D',
  card: '#141D32',
  cardHover: '#1A2642',
  cardBorder: '#223150',
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primarySoft: 'rgba(99, 102, 241, 0.15)',
  accentSky: '#38BDF8',
  accentPurple: '#A855F7',
  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.15)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  inputBg: '#0F172A',
  inputBorder: '#28385E',
  inputFocusBorder: '#6366F1',
  divider: '#1E293B',
  white: '#FFFFFF',
  black: '#000000',
  shadowColor: '#000000',
  statusBar: 'light',
};

export const LightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  cardBorder: '#E2E8F0',
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',
  primarySoft: 'rgba(79, 70, 229, 0.1)',
  accentSky: '#0284C7',
  accentPurple: '#9333EA',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.12)',
  warning: '#D97706',
  warningSoft: 'rgba(217, 119, 6, 0.12)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.12)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputFocusBorder: '#4F46E5',
  divider: '#E2E8F0',
  white: '#FFFFFF',
  black: '#000000',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  statusBar: 'dark',
};

// Default export for backward compatibility
export const Colors = DarkColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const BorderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const Typography = {
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  header: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  subheader: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
};
