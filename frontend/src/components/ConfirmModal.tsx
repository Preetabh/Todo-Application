import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Spacing } from '../constants/theme';
import { Button } from './Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.content,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

              <View style={styles.buttonRow}>
                <Button
                  title={cancelLabel}
                  variant="secondary"
                  onPress={onCancel}
                  disabled={loading}
                  style={styles.cancelBtn}
                />
                <Button
                  title={confirmLabel}
                  variant={isDestructive ? 'danger' : 'primary'}
                  onPress={onConfirm}
                  loading={loading}
                  style={styles.confirmBtn}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
