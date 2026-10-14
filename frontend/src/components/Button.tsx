import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Spacing } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.cardHover,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return { color: colors.primaryLight };
      case 'ghost':
        return { color: colors.primary };
      case 'secondary':
        return { color: colors.textPrimary };
      case 'danger':
      case 'primary':
      default:
        return { color: colors.white };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        getContainerStyle(),
        isDisabled && styles.disabledContainer,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
