import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ErrorMessage } from '../components/ErrorMessage';
import { ConfirmModal } from '../components/ConfirmModal';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

export const ProfileScreen: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <Header
        title="My Profile"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Avatar Card */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
        </View>

        {/* Feedback Message */}
        {statusMessage && (
          <View
            style={[
              styles.feedbackBanner,
              statusMessage.type === 'success'
                ? styles.successBanner
                : styles.errorBanner,
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
                statusMessage.type === 'success' ? Colors.success : Colors.danger
              }
            />
            <Text
              style={[
                styles.feedbackText,
                {
                  color:
                    statusMessage.type === 'success'
                      ? '#A7F3D0'
                      : '#FCA5A5',
                },
              ]}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* Profile Details Card */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Account Information</Text>
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
                  <Ionicons name="person-outline" size={18} color={Colors.textTertiary} />
                  <Text style={styles.infoLabel}>Full Name</Text>
                </View>
                <Text style={styles.infoValue}>{user?.name}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} />
                  <Text style={styles.infoLabel}>Email</Text>
                </View>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.textTertiary} />
                  <Text style={styles.infoLabel}>Member Since</Text>
                </View>
                <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Security & Danger Zone */}
        <Card style={styles.logoutCard}>
          <Text style={styles.cardHeaderTitle}>Session</Text>
          <Text style={styles.logoutNotice}>
            Signing out will remove your active session token from this device.
          </Text>
          <Button
            title="Sign Out"
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={20} color={Colors.white} />}
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  successBanner: {
    backgroundColor: Colors.successSoft,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  errorBanner: {
    backgroundColor: Colors.dangerSoft,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  feedbackText: {
    marginLeft: Spacing.sm,
    fontSize: 14,
    flex: 1,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  logoutCard: {
    marginTop: Spacing.sm,
  },
  logoutNotice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  logoutButton: {
    height: 48,
  },
});
