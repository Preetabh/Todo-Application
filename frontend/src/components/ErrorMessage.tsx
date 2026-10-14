import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Spacing } from '../constants/theme';

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  style,
}) => {
  const { colors, isDark } = useTheme();

  if (!message) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.dangerSoft,
          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.25)',
        },
        style,
      ]}
    >
      <Ionicons
        name="alert-circle-outline"
        size={20}
        color={colors.danger}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
    marginLeft: Spacing.xs,
  },
});
