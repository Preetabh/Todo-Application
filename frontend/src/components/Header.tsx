import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Spacing } from '../constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showThemeToggle?: boolean;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  showThemeToggle = false,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + Spacing.xs, Spacing.lg),
          backgroundColor: colors.background,
          borderBottomColor: colors.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightRow}>
        {showThemeToggle && (
          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: colors.cardHover }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={isDark ? '#FBBF24' : colors.primary}
            />
          </TouchableOpacity>
        )}
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightAction: {
    marginLeft: 2,
  },
});
