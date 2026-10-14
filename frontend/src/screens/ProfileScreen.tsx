import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ConfirmModal } from '../components/ConfirmModal';
import { Spacing, BorderRadius, ThemeMode } from '../constants/theme';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Format joined date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const validate = (): boolean => {
    let isValid = true;
    setNameError(undefined);
    setEmailError(undefined);
    setStatusMessage(null);

    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await api.user.updateProfile({
        name: name.trim(),
        email: email.trim(),
      });

      if (res.success && res.user) {
        updateUser(res.user);
        setIsEditing(false);
        setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Failed to update profile. Please try again.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setNameError(undefined);
    setEmailError(undefined);
    setStatusMessage(null);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="My Profile"
        showBack
        onBack={() => router.back()}
        showThemeToggle
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl),
          },
        ]}
      >
        {/* User Avatar Card */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: colors.primary,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.white }]}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'email@example.com'}
          </Text>
        </View>

        {/* Feedback Message */}
        {statusMessage && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor:
                  statusMessage.type === 'success'
                    ? colors.successSoft
                    : colors.dangerSoft,
                borderColor:
                  statusMessage.type === 'success'
                    ? colors.success
                    : colors.danger,
              },
            ]}
          >
            <Ionicons
              name={
                statusMessage.type === 'success'
                  ? 'checkmark-circle-outline'
                  : 'alert-circle-outline'
              }
              size={20}
              color={
                statusMessage.type === 'success' ? colors.success : colors.danger
              }
            />
            <Text
              style={[
                styles.feedbackText,
                {
                  color:
                    statusMessage.type === 'success'
                      ? colors.success
                      : colors.danger,
                },
              ]}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* Theme / Appearance Selection */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>
            Appearance
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Choose between light, dark, or system default theme
          </Text>

          <View style={[styles.themePillsRow, { backgroundColor: colors.cardHover, borderColor: colors.cardBorder }]}>
            {themeOptions.map((item) => {
              const isSelected = themeMode === item.mode;
              return (
                <TouchableOpacity
                  key={item.mode}
                  style={[
                    styles.themePill,
                    isSelected && [
                      styles.themePillActive,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                      },
                    ],
                  ]}
                  onPress={() => setThemeMode(item.mode)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      {
                        color: isSelected ? colors.primary : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Profile Details Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>
              Account Details
            </Text>
            {!isEditing && (
              <Button
                title="Edit"
                variant="ghost"
                onPress={() => {
                  setStatusMessage(null);
                  setIsEditing(true);
                }}
                style={styles.editButton}
              />
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                label="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError(undefined);
                }}
                icon="person-outline"
                error={nameError}
              />

              <Input
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(undefined);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
                error={emailError}
              />

              <View style={styles.actionRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleCancel}
                  style={styles.cancelBtn}
                />
                <Button
                  title="Save Changes"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.saveBtn}
                />
              </View>
            </View>
          ) : (
            <View style={styles.readOnlyList}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="person-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Full Name</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.name}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Email</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.email}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Member Since</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {formatDate(user?.createdAt)}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Security & Danger Zone */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>
            Session
          </Text>
          <Text style={[styles.logoutNotice, { color: colors.textSecondary }]}>
            Signing out will remove your active session token from this device.
          </Text>
          <Button
            title="Sign Out"
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={20} color={colors.white} />}
            onPress={() => setShowLogoutModal(true)}
            style={styles.logoutButton}
          />
        </Card>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  feedbackText: {
    marginLeft: Spacing.sm,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  themePillsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  themePillActive: {
    borderWidth: 1,
  },
  themePillText: {
    fontSize: 13,
  },
  editButton: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  editForm: {
    marginTop: Spacing.xs,
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
    flex: 1,
  },
  readOnlyList: {
    marginTop: Spacing.xs,
  },
  infoRow: {
    paddingVertical: Spacing.md,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  logoutNotice: {
    fontSize: 13,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  logoutButton: {
    height: 48,
  },
});
