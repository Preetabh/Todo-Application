import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Spacing } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  containerStyle,
  style,
  ...rest
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          },
          isFocused && {
            borderColor: colors.inputFocusBorder,
          },
          !!error && {
            borderColor: colors.danger,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textTertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[styles.input, { color: colors.textPrimary }, style]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.2,
    paddingHorizontal: Spacing.md,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
    fontWeight: '500',
  },
});
