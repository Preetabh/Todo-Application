import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Spacing } from '../constants/theme';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && [styles.fullScreen, { backgroundColor: colors.background }],
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
});
