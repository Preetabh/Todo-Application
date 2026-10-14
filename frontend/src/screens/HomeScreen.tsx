import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { api } from '../services/api';
import { documentStorage, formatBytes } from '../services/documentStorage';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { AddDocumentModal } from '../components/AddDocumentModal';
import { Spacing, BorderRadius } from '../constants/theme';
import { TodoStats, PasswordStats, DocumentStats, StoredDocument } from '../types';

const logoAsset = require('../../assets/images/logo.png');

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { updateInfo, showModal, openUpdateModal } = useAppUpdate();

  const [todoStats, setTodoStats] = useState<TodoStats>({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [passwordStats, setPasswordStats] = useState<PasswordStats>({
    total: 0,
    favorites: 0,
  });
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
  const [recentDocs, setRecentDocs] = useState<StoredDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Modals for quick document interactions directly from Home
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [fadeAnim, slideAnim, pulseAnim]);

  // Greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchAllStats = useCallback(async () => {
    try {
      const [todosRes, passwordsRes, docs, stats] = await Promise.all([
        api.todos.getAll().catch(() => null),
        api.passwords.getAll().catch(() => null),
        documentStorage.getAll().catch(() => []),
        documentStorage.getStats().catch(() => null),
      ]);

      if (todosRes && todosRes.success) {
        if (todosRes.stats) {
          setTodoStats(todosRes.stats);
        } else if (Array.isArray(todosRes.data)) {
          const total = todosRes.data.length;
          const completed = todosRes.data.filter((t: any) => t.completed).length;
          setTodoStats({ total, completed, pending: total - completed });
        }
      }

      if (passwordsRes && passwordsRes.success) {
        if (passwordsRes.stats) {
          setPasswordStats(passwordsRes.stats as PasswordStats);
        } else if (Array.isArray(passwordsRes.data)) {
          const total = passwordsRes.data.length;
          const favorites = passwordsRes.data.filter((p: any) => p.isFavorite).length;
          setPasswordStats({ total, favorites });
        }
      }

      if (stats) {
        setDocStats(stats);
      }
      setRecentDocs(docs.slice(0, 3));
    } catch (err) {
      console.warn('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllStats();
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  const handleShareDoc = async (doc: StoredDocument) => {
    try {
      await documentStorage.shareDocument(doc);
    } catch (err: any) {
      Alert.alert('Share Failed', err.message || 'Unable to share document.');
    }
  };

  const handleToggleDocFavorite = async (id: string) => {
    await documentStorage.toggleFavorite(id);
    await fetchAllStats();
  };

  const handleDeleteDoc = async (id: string) => {
    await documentStorage.deleteDocument(id);
    setViewingDoc(null);
    await fetchAllStats();
  };

  const handleSaveDocFromHome = async (data: any) => {
    await documentStorage.saveDocument({
      title: data.title,
      category: data.category,
      documentNumber: data.documentNumber,
      sourceUri: data.sourceUri,
      fileName: data.fileName || 'document.file',
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
      notes: data.notes,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      isFavorite: data.isFavorite,
    });
    await fetchAllStats();
  };

  // Completion calculation
  const totalTasks = todoStats.total;
  const completionPercentage = totalTasks > 0 ? Math.round((todoStats.completed / totalTasks) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Modern Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + Spacing.sm, Spacing.lg),
            borderBottomColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.userSection}>
          <View style={styles.brandTitleRow}>
            <Image
              source={logoAsset}
              style={styles.logoTiny}
              resizeMode="contain"
            />
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
          </View>
          <Text style={[styles.userNameText, { color: colors.textPrimary }]} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>
        </View>

        <View style={styles.topActions}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.cardHover,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={19}
              color={isDark ? '#FBBF24' : colors.primary}
            />
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.cardHover,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={19}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.logoutButton,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: 'transparent',
              },
            ]}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Subtle Floating Update Notice (When available) */}
          {updateInfo?.hasUpdate && !showModal && (
            <TouchableOpacity
              style={[
                styles.updateNoticeBanner,
                {
                  backgroundColor: isDark
                    ? 'rgba(32, 138, 239, 0.16)'
                    : 'rgba(32, 138, 239, 0.08)',
                  borderColor: isDark
                    ? 'rgba(56, 189, 248, 0.4)'
                    : 'rgba(32, 138, 239, 0.3)',
                },
              ]}
              onPress={openUpdateModal}
              activeOpacity={0.85}
            >
              <View style={styles.updateNoticeLeft}>
                <View
                  style={[
                    styles.updateNoticeIconWrap,
                    {
                      backgroundColor: isDark
                        ? 'rgba(32, 138, 239, 0.25)'
                        : '#E0F2FE',
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                </View>
                <View style={styles.updateNoticeTextCol}>
                  <Text
                    style={[
                      styles.updateNoticeTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Release Ready • v{updateInfo.latestVersion}
                  </Text>
                  <Text
                    style={[
                      styles.updateNoticeSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to view release details & install
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.updateNoticePill,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.updateNoticePillText}>Update</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

          {/* Hero Banner Card with Glowing Brand Avatar */}
          <Card style={styles.welcomeBanner}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerTextCol}>
                <View style={styles.securityPill}>
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.securityPillText, { color: colors.primary }]}
                  >
                    On-Device Security Hub
                  </Text>
                </View>
                <Text
                  style={[styles.bannerTitle, { color: colors.textPrimary }]}
                >
                  DigentTech Smart Safe
                </Text>
                <Text
                  style={[
                    styles.bannerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Store important IDs, credentials, and tasks directly on your phone. Private, encrypted, and instantly shareable.
                </Text>
              </View>

              {/* Animated Glowing Logo Avatar */}
              <Animated.View
                style={[
                  styles.logoHeroContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isDark
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(79, 70, 229, 0.10)',
                    borderColor: isDark
                      ? 'rgba(99, 102, 241, 0.35)'
                      : 'rgba(79, 70, 229, 0.25)',
                  },
                ]}
              >
                <Image
                  source={logoAsset}
                  style={styles.logoHeroImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </Card>

          {/* Quick Action Shortcuts Row */}
          <View style={styles.quickShortcutsRow}>
            {/* Quick Add Document */}
            <TouchableOpacity
              style={[
                styles.shortcutItem,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={() => setShowAddDocModal(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIconWrap,
                  { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
                ]}
              >
                <Ionicons name="document-attach" size={20} color="#3B82F6" />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: colors.textPrimary }]}
              >
                + Document
              </Text>
            </TouchableOpacity>

            {/* Quick Add Password */}
            <TouchableOpacity
              style={[
                styles.shortcutItem,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={() => router.push('/passwords')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIconWrap,
                  { backgroundColor: 'rgba(99, 102, 241, 0.15)' },
                ]}
              >
                <Ionicons name="key" size={20} color="#6366F1" />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: colors.textPrimary }]}
              >
                + Password
              </Text>
            </TouchableOpacity>

            {/* Quick Add Task */}
            <TouchableOpacity
              style={[
                styles.shortcutItem,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={() => router.push('/todo')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIconWrap,
                  { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                ]}
              >
                <Ionicons name="checkbox" size={20} color="#F59E0B" />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: colors.textPrimary }]}
              >
                + Task
              </Text>
            </TouchableOpacity>

            {/* Updates / Profile */}
            <TouchableOpacity
              style={[
                styles.shortcutItem,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={() => router.push('/profile')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIconWrap,
                  { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <Ionicons name="settings-outline" size={20} color="#10B981" />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: colors.textPrimary }]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tri-Pillar Hub Applications */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>
            Core Applications & Vaults
          </Text>

          <Card style={styles.actionsCard}>
            {/* 1. Important Document Locker (NEW FEATURE) */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/documents')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: 'rgba(59, 130, 246, 0.16)' },
                ]}
              >
                <Ionicons name="folder-open" size={24} color="#3B82F6" />
              </View>
              <View style={styles.actionTextCol}>
                <View style={styles.actionTitleRow}>
                  <Text
                    style={[styles.actionTitle, { color: colors.textPrimary }]}
                  >
                    Document Locker
                  </Text>
                  <View
                    style={[
                      styles.actionBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(59, 130, 246, 0.18)'
                          : '#EFF6FF',
                        borderColor: '#3B82F6',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.actionBadgeText, { color: '#3B82F6' }]}
                    >
                      {docStats.total} Saved • {formatBytes(docStats.totalSizeBytes)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Store Aadhaar, PAN, Passports & bills offline with 1-tap view & share
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            <View
              style={[styles.actionDivider, { backgroundColor: colors.cardBorder }]}
            />

            {/* 2. Password Manager Vault Action */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/passwords')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: 'rgba(99, 102, 241, 0.16)' },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color="#6366F1"
                />
              </View>
              <View style={styles.actionTextCol}>
                <View style={styles.actionTitleRow}>
                  <Text
                    style={[styles.actionTitle, { color: colors.textPrimary }]}
                  >
                    Password Vault
                  </Text>
                  <View
                    style={[
                      styles.actionBadge,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#E0F2FE',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.actionBadgeText, { color: colors.primary }]}
                    >
                      {passwordStats.total} Saved
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  AES-256 encrypted passwords, logins, and generator
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            <View
              style={[styles.actionDivider, { backgroundColor: colors.cardBorder }]}
            />

            {/* 3. Task Manager Action */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/todo')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: 'rgba(245, 158, 11, 0.16)' },
                ]}
              >
                <Ionicons
                  name="checkbox-outline"
                  size={24}
                  color="#F59E0B"
                />
              </View>
              <View style={styles.actionTextCol}>
                <View style={styles.actionTitleRow}>
                  <Text
                    style={[styles.actionTitle, { color: colors.textPrimary }]}
                  >
                    Task Manager
                  </Text>
                  <View
                    style={[
                      styles.actionBadge,
                      {
                        backgroundColor: isDark ? '#2D2013' : '#FEF3C7',
                        borderColor: '#F59E0B',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.actionBadgeText, { color: '#F59E0B' }]}
                    >
                      {todoStats.pending} Pending
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Track priorities, organize lists, and mark completion
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </Card>

          {/* Recent Important Documents Spotlight */}
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionHeader, { color: colors.textPrimary, marginTop: Spacing.xl }]}>
              Important Documents
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/documents')}
              activeOpacity={0.7}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                View All ({docStats.total})
              </Text>
            </TouchableOpacity>
          </View>

          {recentDocs.length > 0 ? (
            recentDocs.map((doc) => (
              <Card key={doc.id} style={styles.recentDocCard}>
                <TouchableOpacity
                  style={styles.recentDocTouchable}
                  onPress={() => setViewingDoc(doc)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.recentDocIconBadge,
                      {
                        backgroundColor:
                          doc.fileType === 'pdf'
                            ? 'rgba(239, 68, 68, 0.14)'
                            : 'rgba(59, 130, 246, 0.14)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        doc.fileType === 'pdf'
                          ? 'document-text'
                          : doc.fileType === 'image'
                          ? 'image'
                          : 'folder'
                      }
                      size={20}
                      color={doc.fileType === 'pdf' ? '#EF4444' : '#3B82F6'}
                    />
                  </View>

                  <View style={styles.recentDocInfoCol}>
                    <View style={styles.recentDocTitleRow}>
                      <Text
                        style={[
                          styles.recentDocTitle,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {doc.title}
                      </Text>
                      {doc.isFavorite && (
                        <Ionicons name="star" size={13} color="#F59E0B" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.recentDocSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {doc.category.toUpperCase()} • {formatBytes(doc.fileSizeBytes)}
                    </Text>
                  </View>

                  {/* Instant Share Button */}
                  <TouchableOpacity
                    style={[
                      styles.recentDocShareBtn,
                      { backgroundColor: colors.primarySoft },
                    ]}
                    onPress={() => handleShareDoc(doc)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyDocsCard}>
              <View style={styles.emptyDocsRow}>
                <View
                  style={[
                    styles.emptyDocsIconWrap,
                    { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
                  ]}
                >
                  <Ionicons name="folder-open" size={24} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.emptyDocsTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Save Your First Document
                  </Text>
                  <Text
                    style={[
                      styles.emptyDocsSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Keep Aadhaar, PAN card, or certificates safe in phone memory.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.emptyDocsBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setShowAddDocModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyDocsBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Productivity & Security Health Summary */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary, marginTop: Spacing.xl }]}>
            Productivity & Security Health
          </Text>

          <Card style={styles.healthCard}>
            {/* Task completion bar */}
            <View style={styles.healthRow}>
              <View style={styles.healthLabelRow}>
                <Text style={[styles.healthLabel, { color: colors.textPrimary }]}>
                  Task Completion Rate
                </Text>
                <Text style={[styles.healthPercent, { color: colors.primary }]}>
                  {completionPercentage}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: colors.cardHover },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(completionPercentage, 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={[
                styles.healthDivider,
                { backgroundColor: colors.cardBorder },
              ]}
            />

            {/* Offline Storage Status */}
            <View style={styles.storageSecurityStatusRow}>
              <View style={styles.statusBadgeIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={colors.success}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.statusBadgeTitle, { color: colors.textPrimary }]}
                >
                  100% Offline Vault Guaranteed
                </Text>
                <Text
                  style={[
                    styles.statusBadgeDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  Zero server leaks. All documents remain in your phone storage.
                </Text>
              </View>
            </View>
          </Card>

          {/* Dual Action Buttons */}
          <View style={styles.launchButtonsRow}>
            <Button
              title="Open Document Safe"
              variant="primary"
              icon={
                <Ionicons name="folder-open-outline" size={18} color="#FFFFFF" />
              }
              onPress={() => router.push('/documents')}
              style={styles.launchBtn}
            />

            <Button
              title="Open Password Vault"
              variant="secondary"
              icon={
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={colors.textPrimary}
                />
              }
              onPress={() => router.push('/passwords')}
              style={styles.launchBtn}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Document Viewer Modal from Home */}
      <DocumentViewerModal
        visible={!!viewingDoc}
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onDelete={handleDeleteDoc}
        onEdit={(doc) => {
          setViewingDoc(null);
          router.push('/documents');
        }}
        onToggleFavorite={handleToggleDocFavorite}
      />

      {/* Quick Add Document Modal from Home */}
      <AddDocumentModal
        visible={showAddDocModal}
        onClose={() => setShowAddDocModal(false)}
        onSave={handleSaveDocFromHome}
      />

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

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  userSection: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoTiny: {
    width: 20,
    height: 20,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    borderRadius: BorderRadius.round,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  welcomeBanner: {
    padding: Spacing.xl,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  securityPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  logoHeroContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoHeroImage: {
    width: 44,
    height: 44,
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  shortcutItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  shortcutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: Spacing.xl,
  },
  actionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: Spacing.sm,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionDescription: {
    fontSize: 12,
    marginTop: 3,
  },
  actionDivider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  recentDocCard: {
    padding: 0,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  recentDocTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  recentDocIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  recentDocInfoCol: {
    flex: 1,
  },
  recentDocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentDocTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  recentDocSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  recentDocShareBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  emptyDocsCard: {
    padding: Spacing.md,
  },
  emptyDocsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyDocsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDocsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDocsSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyDocsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
  },
  emptyDocsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  healthCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  healthRow: {
    marginBottom: Spacing.xs,
  },
  healthLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  healthPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  storageSecurityStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadgeDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  launchButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  launchBtn: {
    flex: 1,
    height: 48,
  },
  updateNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  updateNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  updateNoticeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  updateNoticeTextCol: {
    flex: 1,
  },
  updateNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  updateNoticeSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  updateNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  updateNoticePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
