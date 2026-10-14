import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Spacing } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'highlight' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
}) => {
  const { colors, isDark } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'highlight':
        return {
          backgroundColor: colors.cardHover,
          borderColor: colors.primary,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.cardBorder,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        };
    }
  };

  const shadowStyles: ViewStyle = isDark
    ? {}
    : {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, getVariantStyles(), shadowStyles, style]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, getVariantStyles(), shadowStyles, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
