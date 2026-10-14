import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

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
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="alert-circle-outline"
        size={20}
        color={Colors.danger}
        style={styles.icon}
      />
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    color: '#FCA5A5',
    fontSize: 14,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginLeft: Spacing.xs,
  },
});
