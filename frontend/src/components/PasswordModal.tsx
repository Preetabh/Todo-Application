import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { Input } from './Input';
import { Spacing, BorderRadius } from '../constants/theme';
import { PasswordItem, PasswordCategory } from '../types';
import {
  generateStrongPassword,
  getPasswordStrength,
} from '../utils/passwordGenerator';

interface PasswordModalProps {
  visible: boolean;
  itemToEdit: PasswordItem | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    username: string;
    password: string;
    website: string;
    category: PasswordCategory;
    notes: string;
    isFavorite: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

const CATEGORIES: {
  key: PasswordCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'login', label: 'Login', icon: 'key-outline' },
  { key: 'finance', label: 'Finance', icon: 'wallet-outline' },
  { key: 'social', label: 'Social', icon: 'chatbubbles-outline' },
  { key: 'work', label: 'Work', icon: 'briefcase-outline' },
  { key: 'card', label: 'Card', icon: 'card-outline' },
  { key: 'other', label: 'Other', icon: 'shield-checkmark-outline' },
];

export const PasswordModal: React.FC<PasswordModalProps> = ({
  visible,
  itemToEdit,
  onClose,
  onSave,
  loading = false,
}) => {
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState<PasswordCategory>('login');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [errors, setErrors] = useState<{ title?: string; password?: string }>({});

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title || '');
      setUsername(itemToEdit.username || '');
      setPassword(itemToEdit.password || '');
      setWebsite(itemToEdit.website || '');
      setCategory(itemToEdit.category || 'login');
      setNotes(itemToEdit.notes || '');
      setIsFavorite(Boolean(itemToEdit.isFavorite));
    } else {
      setTitle('');
      setUsername('');
      setPassword('');
      setWebsite('');
      setCategory('login');
      setNotes('');
      setIsFavorite(false);
    }
    setShowPassword(false);
    setErrors({});
  }, [itemToEdit, visible]);

  const strength = getPasswordStrength(password);

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword({ length: 16 });
    setPassword(generated);
    setShowPassword(true);
    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: { title?: string; password?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Account / Service name is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave({
      title: title.trim(),
      username: username.trim(),
      password: password.trim(),
      website: website.trim(),
      category,
      notes: notes.trim(),
      isFavorite,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleCol}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {itemToEdit ? 'Edit Password' : 'New Password'}
              </Text>
              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}
              >
                Encrypted with AES-256-GCM
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.cardHover,
                  borderColor: colors.cardBorder,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-outline"
                size={20}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title / Service Name */}
            <Input
              label="Service / Account Name"
              placeholder="e.g. Google, GitHub, Netflix"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
              }}
              icon="globe-outline"
              error={errors.title}
            />

            {/* Category Selector Pills */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Category
            </Text>
            <View style={styles.categoryPillsRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.cardHover,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Username / Email */}
            <Input
              label="Username / Email"
              placeholder="user@example.com or @username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              icon="person-outline"
            />

            {/* Password Field with Generator Button */}
            <View style={styles.passwordHeaderRow}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Password
              </Text>
              <TouchableOpacity
                onPress={handleGeneratePassword}
                style={[
                  styles.generateBtn,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="dice-outline" size={14} color={colors.primary} />
                <Text
                  style={[styles.generateBtnText, { color: colors.primary }]}
                >
                  Generate Strong
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password)
                  setErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="Enter or generate password"
              isPassword={true}
              icon="lock-closed-outline"
              error={errors.password}
            />

            {/* Strength Meter Bar */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthTextRow}>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Strength
                  </Text>
                  <Text
                    style={[
                      styles.strengthScoreText,
                      { color: strength.color },
                    ]}
                  >
                    {strength.label}
                  </Text>
                </View>

                <View
                  style={[
                    styles.strengthTrack,
                    { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
                  ]}
                >
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${strength.score}%`,
                        backgroundColor: strength.color,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Website URL */}
            <Input
              label="Website URL (Optional)"
              placeholder="https://..."
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
              icon="link-outline"
            />

            {/* Notes */}
            <Input
              label="Security Notes (Optional)"
              placeholder="Recovery codes, PIN, security hints..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              icon="document-text-outline"
            />

            {/* Favorite Toggle */}
            <TouchableOpacity
              style={[
                styles.favoriteToggleRow,
                {
                  backgroundColor: colors.cardHover,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => setIsFavorite(!isFavorite)}
              activeOpacity={0.7}
            >
              <View style={styles.favoriteLeft}>
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={20}
                  color={isFavorite ? '#F59E0B' : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.favoriteToggleText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Pin to Favorites
                </Text>
              </View>

              <View
                style={[
                  styles.checkboxCircle,
                  {
                    backgroundColor: isFavorite
                      ? '#F59E0B'
                      : 'transparent',
                    borderColor: isFavorite ? '#F59E0B' : colors.cardBorder,
                  },
                ]}
              >
                {isFavorite && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={styles.cancelBtn}
              />
              <Button
                title={itemToEdit ? 'Save Changes' : 'Store Password'}
                variant="primary"
                loading={loading}
                icon={
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                }
                onPress={handleSave}
                style={styles.saveBtn}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  formScroll: {
    paddingHorizontal: Spacing.xl,
  },
  formContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    gap: 6,
  },
  categoryPillText: {
    fontSize: 12,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  generateBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  strengthContainer: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
  strengthTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  strengthScoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  strengthTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  favoriteToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  favoriteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favoriteToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1.6,
  },
});
