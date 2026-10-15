import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { api } from '../services/api';
import { documentStorage, formatBytes } from '../services/documentStorage';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ConfirmModal } from '../components/ConfirmModal';
import { Spacing, BorderRadius, ThemeMode } from '../constants/theme';
import { DocumentStats, PasswordStats, TodoStats } from '../types';
import { registerForPushNotificationsAsync } from '../services/pushNotification';
import { storage } from '../services/storage';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // App metrics
  const [docStats, setDocStats] = useState<DocumentStats>({
    total: 0,
    favorites: 0,
    categoriesCount: {
      identity: 0,
      education: 0,
      finance: 0,
      health: 0,
      vehicle: 0,
      bills: 0,
      other: 0,
    },
    totalSizeBytes: 0,
  });
  const [passwordCount, setPasswordCount] = useState<number>(0);
  const [todoCount, setTodoCount] = useState<number>(0);

  // In-App APK Update System
  const { currentVersion, isChecking, checkForUpdates } = useAppUpdate();
  const [updateFeedback, setUpdateFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Push Notification State
  const [pushStatus, setPushStatus] = useState<string>('Checking...');
  const [pushTokenVal, setPushTokenVal] = useState<string | null>(null);
  const [isSyncingPush, setIsSyncingPush] = useState<boolean>(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  useEffect(() => {
    storage.getPushToken().then((token) => {
      if (token) {
        setPushTokenVal(token);
        setPushStatus('Active & Registered');
      } else {
        setPushStatus('Not Configured');
      }
    });
  }, []);

  useEffect(() => {
    // Load overview stats for the profile dashboard
    const loadOverview = async () => {
      try {
        const [docsRes, passRes, todoRes] = await Promise.all([
          documentStorage.getStats().catch(() => null),
          api.passwords.getAll().catch(() => null),
          api.todos.getAll().catch(() => null),
        ]);

        if (docsRes) setDocStats(docsRes);
        if (passRes?.success && Array.isArray(passRes.data)) {
          setPasswordCount(passRes.data.length);
        }
        if (todoRes?.success && Array.isArray(todoRes.data)) {
          setTodoCount(todoRes.data.length);
        }
      } catch (err) {
        console.warn('Profile overview stats failed:', err);
      }
    };

    loadOverview();
  }, []);

  const handleManualCheck = async () => {
    setUpdateFeedback(null);
    try {
      const res = await checkForUpdates(true);
      if (res && !res.hasUpdate) {
        setUpdateFeedback({
          type: 'success',
          text: `You're on the latest build! Version ${res.currentVersion} is up to date.`,
        });
      }
    } catch (err: any) {
      setUpdateFeedback({
        type: 'error',
        text: err.message || 'Unable to check for updates right now.',
      });
    }
  };

  const handleClearCache = async () => {
    try {
      if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
        const apkCacheDir = `${FileSystem.cacheDirectory}apk-updates/`;
        const dirInfo = await FileSystem.getInfoAsync(apkCacheDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(apkCacheDir, { idempotent: true });
        }
      }
      Alert.alert('Cache Cleared', 'Temporary downloads and caches were cleared safely. Your stored documents and passwords remain intact.');
    } catch (err: any) {
      Alert.alert('Clear Cache', err.message || 'Failed to clear cache.');
    }
  };

  const handleCopyUserId = async () => {
    if (!user?.id) return;
    await Clipboard.setStringAsync(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Active Member';
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
        setStatusMessage({
          type: 'success',
          text: 'Profile updated successfully!',
        });
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

  const themeOptions: {
    mode: ThemeMode;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Profile & Settings"
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
        showsVerticalScrollIndicator={false}
      >
        {/* User Hero Avatar Card */}
        <Card style={styles.userHeroCard}>
          <View style={styles.userHeroRow}>
            {/* Glowing Avatar */}
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.primary,
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : '#C7D2FE',
                },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.white }]}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
              <View
                style={[
                  styles.onlineStatusDot,
                  {
                    backgroundColor: colors.success,
                    borderColor: colors.card,
                  },
                ]}
              />
            </View>

            {/* User Info Col */}
            <View style={styles.userInfoCol}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.userName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {user?.name || 'User'}
                </Text>
                <View
                  style={[
                    styles.verifiedBadge,
                    {
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={colors.success}
                  />
                  <Text
                    style={[styles.verifiedBadgeText, { color: colors.success }]}
                  >
                    Verified
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.userEmail, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {user?.email || 'email@example.com'}
              </Text>

              <View style={styles.memberSinceRow}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.memberSinceText, { color: colors.textTertiary }]}
                >
                  Joined {formatDate(user?.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* 4 Interactive Profile Stats Grid */}
        <View style={styles.metricsGrid}>
          {/* Important Documents */}
          <TouchableOpacity
            style={styles.metricGridItem}
            onPress={() => router.push('/documents')}
            activeOpacity={0.8}
          >
            <Card style={styles.metricTile}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
                ]}
              >
                <Ionicons name="document-text" size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.metricTileCount, { color: colors.textPrimary }]}>
                {docStats.total}
              </Text>
              <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                Documents
              </Text>
              <Text style={[styles.metricTileSub, { color: '#3B82F6' }]}>
                {formatBytes(docStats.totalSizeBytes)}
              </Text>
            </Card>
          </TouchableOpacity>

          {/* Passwords Vault */}
          <TouchableOpacity
            style={styles.metricGridItem}
            onPress={() => router.push('/passwords')}
            activeOpacity={0.8}
          >
            <Card style={styles.metricTile}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: 'rgba(99, 102, 241, 0.15)' },
                ]}
              >
                <Ionicons name="key" size={18} color="#6366F1" />
              </View>
              <Text style={[styles.metricTileCount, { color: colors.textPrimary }]}>
                {passwordCount}
              </Text>
              <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                Passwords
              </Text>
              <Text style={[styles.metricTileSub, { color: '#6366F1' }]}>
                Encrypted
              </Text>
            </Card>
          </TouchableOpacity>

          {/* Task Manager */}
          <TouchableOpacity
            style={styles.metricGridItem}
            onPress={() => router.push('/todo')}
            activeOpacity={0.8}
          >
            <Card style={styles.metricTile}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                ]}
              >
                <Ionicons name="checkbox" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.metricTileCount, { color: colors.textPrimary }]}>
                {todoCount}
              </Text>
              <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                Tasks
              </Text>
              <Text style={[styles.metricTileSub, { color: '#F59E0B' }]}>
                Checklists
              </Text>
            </Card>
          </TouchableOpacity>

          {/* Local Security Score */}
          <View style={styles.metricGridItem}>
            <Card style={styles.metricTile}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <Text style={[styles.metricTileCount, { color: colors.success }]}>
                100%
              </Text>
              <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                On-Device
              </Text>
              <Text style={[styles.metricTileSub, { color: colors.success }]}>
                Private Safe
              </Text>
            </Card>
          </View>
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
                statusMessage.type === 'success'
                  ? colors.success
                  : colors.danger
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

        {/* Document Safe Feature Card */}
        <Card style={styles.featureCard}>
          <View style={styles.featureCardHeader}>
            <View
              style={[
                styles.featureIconWrap,
                { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
              ]}
            >
              <Ionicons name="folder-open" size={22} color="#3B82F6" />
            </View>
            <View style={styles.featureTextCol}>
              <Text
                style={[styles.featureTitle, { color: colors.textPrimary }]}
              >
                Important Document Locker
              </Text>
              <Text
                style={[styles.featureDesc, { color: colors.textSecondary }]}
              >
                Keep Aadhaar, PAN, Passports, and certificates safely on your device with instant sharing.
              </Text>
            </View>
          </View>

          <View style={styles.featureActionRow}>
            <Button
              title="Open Document Locker"
              variant="primary"
              icon={
                <Ionicons
                  name="arrow-forward-circle"
                  size={18}
                  color="#FFFFFF"
                />
              }
              onPress={() => router.push('/documents')}
              style={styles.openLockerBtn}
            />
          </View>
        </Card>

        {/* Theme / Appearance Selection */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}
              >
                Theme & Appearance
              </Text>
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Choose between system default, light, or sleek dark mode
          </Text>

          <View
            style={[
              styles.themePillsRow,
              {
                backgroundColor: colors.cardHover,
                borderColor: colors.cardBorder,
              },
            ]}
          >
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
                        color: isSelected
                          ? colors.primary
                          : colors.textSecondary,
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
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="person-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}
              >
                Account Information
              </Text>
            </View>
            {!isEditing && (
              <Button
                title="Edit"
                variant="ghost"
                icon={
                  <Ionicons
                    name="pencil"
                    size={14}
                    color={colors.primary}
                  />
                }
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
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: colors.textTertiary }]}
                  >
                    Full Name
                  </Text>
                </View>
                <Text
                  style={[styles.infoValue, { color: colors.textPrimary }]}
                >
                  {user?.name}
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.cardBorder },
                ]}
              />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: colors.textTertiary }]}
                  >
                    Email Address
                  </Text>
                </View>
                <Text
                  style={[styles.infoValue, { color: colors.textPrimary }]}
                >
                  {user?.email}
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.cardBorder },
                ]}
              />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons
                    name="finger-print-outline"
                    size={16}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: colors.textTertiary }]}
                  >
                    Account ID
                  </Text>
                </View>
                <View style={styles.userIdWrap}>
                  <Text
                    style={[
                      styles.userIdText,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {user?.id || 'N/A'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyUserId}
                    style={styles.copyIdBtn}
                  >
                    <Ionicons
                      name={copiedId ? 'checkmark' : 'copy-outline'}
                      size={14}
                      color={copiedId ? colors.success : colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Storage & Cache Management */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="server-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}
              >
                Device Storage & Cache
              </Text>
            </View>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Documents are stored completely inside your phone storage
          </Text>

          <View style={styles.storageOverviewRow}>
            <View style={styles.storageInfoCol}>
              <Text
                style={[styles.storageSizeBig, { color: colors.textPrimary }]}
              >
                {formatBytes(docStats.totalSizeBytes)}
              </Text>
              <Text
                style={[styles.storageSizeDesc, { color: colors.textSecondary }]}
              >
                Used by {docStats.total} offline documents
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.clearCacheBtn,
                {
                  backgroundColor: colors.cardHover,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-bin-outline"
                size={16}
                color={colors.textPrimary}
              />
              <Text
                style={[styles.clearCacheText, { color: colors.textPrimary }]}
              >
                Clear Temp Cache
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* App Version & In-App APK Updates Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="cloud-download-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}
              >
                In-App APK Updates
              </Text>
            </View>
            <View
              style={[
                styles.versionTag,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Text style={[styles.versionTagText, { color: colors.primary }]}>
                v{currentVersion}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Direct in-app APK upgrades without Google Play Store
          </Text>

          {updateFeedback && (
            <View
              style={[
                styles.feedbackBanner,
                {
                  backgroundColor:
                    updateFeedback.type === 'success'
                      ? colors.successSoft
                      : updateFeedback.type === 'info'
                      ? colors.primarySoft
                      : colors.dangerSoft,
                  borderColor:
                    updateFeedback.type === 'success'
                      ? colors.success
                      : updateFeedback.type === 'info'
                      ? colors.primary
                      : colors.danger,
                  marginTop: Spacing.xs,
                  marginBottom: Spacing.md,
                },
              ]}
            >
              <Ionicons
                name={
                  updateFeedback.type === 'success'
                    ? 'checkmark-circle-outline'
                    : updateFeedback.type === 'info'
                    ? 'information-circle-outline'
                    : 'alert-circle-outline'
                }
                size={18}
                color={
                  updateFeedback.type === 'success'
                    ? colors.success
                    : updateFeedback.type === 'info'
                    ? colors.primary
                    : colors.danger
                }
              />
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color:
                      updateFeedback.type === 'success'
                        ? colors.success
                        : updateFeedback.type === 'info'
                        ? colors.primary
                        : colors.danger,
                  },
                ]}
              >
                {updateFeedback.text}
              </Text>
            </View>
          )}

          <Button
            title="Check for New Releases"
            variant="secondary"
            loading={isChecking}
            icon={
              <Ionicons
                name="refresh-outline"
                size={18}
                color={colors.textPrimary}
              />
            }
            onPress={handleManualCheck}
            style={styles.updateCheckBtn}
          />
        </Card>

        {/* Push Notifications Configuration */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}
              >
                Push Notifications
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                backgroundColor:
                  pushTokenVal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: pushTokenVal ? '#10B981' : '#EF4444',
                }}
              >
                {pushStatus}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            DIGENT TECH push delivery allows you to receive instant announcements, task reminders, and security notices.
          </Text>

          {pushFeedback && (
            <View
              style={[
                styles.feedbackBanner,
                {
                  backgroundColor: pushTokenVal
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  borderColor: pushTokenVal
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  { color: pushTokenVal ? '#10B981' : colors.danger },
                ]}
              >
                {pushFeedback}
              </Text>
            </View>
          )}

          <Button
            title="Sync & Register Device Push Token"
            variant="secondary"
            loading={isSyncingPush}
            icon={
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color={colors.textPrimary}
              />
            }
            onPress={async () => {
              setIsSyncingPush(true);
              setPushFeedback(null);
              try {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                  setPushTokenVal(token);
                  setPushStatus('Active & Registered');
                  setPushFeedback('Push token registered successfully with backend!');
                } else {
                  setPushStatus('Not Configured');
                  setPushFeedback('Push permission denied or running in simulator without hardware push support.');
                }
              } catch (err: any) {
                setPushFeedback(err.message || 'Push sync failed.');
              } finally {
                setIsSyncingPush(false);
              }
            }}
            style={styles.updateCheckBtn}
          />
        </Card>

        {/* Session & Sign Out */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="shield-outline"
                size={20}
                color={colors.danger}
              />
              <Text
                style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}
              >
                Account Session
              </Text>
            </View>
          </View>
          <Text style={[styles.logoutNotice, { color: colors.textSecondary }]}>
            Signing out will remove your active session token from this phone. Your offline documents will remain securely locked.
          </Text>
          <Button
            title="Sign Out"
            variant="danger"
            icon={
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.white}
              />
            }
            onPress={() => setShowLogoutModal(true)}
            style={styles.logoutButton}
          />
        </Card>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
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
  userHeroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  userHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    marginRight: Spacing.lg,
    position: 'relative',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
  },
  userInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 3,
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  memberSinceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricGridItem: {
    flex: 1,
  },
  metricTile: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricTileCount: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  metricTileSub: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  featureCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  featureActionRow: {
    marginTop: Spacing.md,
  },
  openLockerBtn: {
    height: 44,
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
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  versionTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
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
    height: 32,
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
    paddingVertical: Spacing.sm + 2,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  userIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userIdText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  copyIdBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
  },
  storageOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageInfoCol: {
    flex: 1,
  },
  storageSizeBig: {
    fontSize: 22,
    fontWeight: '800',
  },
  storageSizeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  clearCacheBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  clearCacheText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutNotice: {
    fontSize: 12,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 17,
  },
  logoutButton: {
    height: 48,
  },
  updateCheckBtn: {
    marginTop: Spacing.sm,
    height: 44,
  },
});
