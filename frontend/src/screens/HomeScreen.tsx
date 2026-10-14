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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Spacing, BorderRadius } from '../constants/theme';
import { TodoStats, PasswordStats } from '../types';

const logoAsset = require('../../assets/images/logo.png');

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [todoStats, setTodoStats] = useState<TodoStats>({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [passwordStats, setPasswordStats] = useState<PasswordStats>({
    total: 0,
    favorites: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing glow animation on logo
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [fadeAnim, slideAnim, pulseAnim]);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchAllStats = useCallback(async () => {
    try {
      const [todosRes, passwordsRes] = await Promise.all([
        api.todos.getAll().catch(() => null),
        api.passwords.getAll().catch(() => null),
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Logo and Actions */}
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
          <Text style={[styles.userNameText, { color: colors.textPrimary }]}>
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
              size={20}
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
              size={20}
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
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
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
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Animated Hero Banner Card with Brand Logo */}
          <Card style={styles.welcomeBanner}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerTextCol}>
                <View style={styles.securityPill}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.securityPillText, { color: colors.primary }]}
                  >
                    AES-256 Vault Active
                  </Text>
                </View>
                <Text
                  style={[styles.bannerTitle, { color: colors.textPrimary }]}
                >
                  DigentTech Security Hub
                </Text>
                <Text
                  style={[
                    styles.bannerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {passwordStats.total > 0
                    ? `${passwordStats.total} credentials protected in your encrypted vault.`
                    : 'Manage your tasks and protect your credentials in one unified app.'}
                </Text>
              </View>

              {/* Animated Glowing Logo Avatar */}
              <Animated.View
                style={[
                  styles.logoHeroContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isDark
                      ? 'rgba(32, 138, 239, 0.15)'
                      : 'rgba(32, 138, 239, 0.10)',
                    borderColor: isDark
                      ? 'rgba(32, 138, 239, 0.35)'
                      : 'rgba(32, 138, 239, 0.25)',
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

          {/* Dual Statistics Grid: Tasks & Passwords */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>
            Overview & Security
          </Text>

          <View style={styles.statsRow}>
            {/* Passwords in Vault */}
            <TouchableOpacity
              style={styles.statTouch}
              onPress={() => router.push('/passwords')}
              activeOpacity={0.8}
            >
              <Card style={styles.statCard}>
                <View
                  style={[
                    styles.statIconBadge,
                    { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
                  ]}
                >
                  <Ionicons name="key" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.statCount, { color: colors.textPrimary }]}>
                  {loading ? '-' : passwordStats.total}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Vault Passwords
                </Text>
              </Card>
            </TouchableOpacity>

            {/* Pending Tasks */}
            <TouchableOpacity
              style={styles.statTouch}
              onPress={() => router.push('/todo')}
              activeOpacity={0.8}
            >
              <Card style={styles.statCard}>
                <View
                  style={[
                    styles.statIconBadge,
                    { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                  ]}
                >
                  <Ionicons name="time" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.statCount, { color: colors.textPrimary }]}>
                  {loading ? '-' : todoStats.pending}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Pending Tasks
                </Text>
              </Card>
            </TouchableOpacity>

            {/* Completed Tasks */}
            <TouchableOpacity
              style={styles.statTouch}
              onPress={() => router.push('/todo')}
              activeOpacity={0.8}
            >
              <Card style={styles.statCard}>
                <View
                  style={[
                    styles.statIconBadge,
                    { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                  ]}
                >
                  <Ionicons
                    name="checkmark-done"
                    size={20}
                    color="#10B981"
                  />
                </View>
                <Text style={[styles.statCount, { color: colors.textPrimary }]}>
                  {loading ? '-' : todoStats.completed}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Completed
                </Text>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Quick Actions Hub */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>
            Applications & Tools
          </Text>

          <Card style={styles.actionsCard}>
            {/* Password Manager Vault Action */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/passwords')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: 'rgba(59, 130, 246, 0.16)' },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color="#3B82F6"
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

            {/* Todo Manager Action */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/todo')}
              activeOpacity={0.7}
            >
              <View
                style={[styles.actionIconCircle, { backgroundColor: colors.primarySoft }]}
              >
                <Ionicons
                  name="checkbox-outline"
                  size={24}
                  color={colors.primary}
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

            <View
              style={[styles.actionDivider, { backgroundColor: colors.cardBorder }]}
            />

            {/* Profile Action */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/profile')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.15)'
                      : 'rgba(2, 132, 199, 0.1)',
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={colors.accentSky}
                />
              </View>
              <View style={styles.actionTextCol}>
                <Text
                  style={[styles.actionTitle, { color: colors.textPrimary }]}
                >
                  Profile & Settings
                </Text>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Theme customization and in-app APK update checker
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </Card>

          {/* Quick Launch Buttons */}
          <View style={styles.launchButtonsRow}>
            <Button
              title="Open Password Vault"
              variant="primary"
              icon={
                <Ionicons name="key-outline" size={18} color="#FFFFFF" />
              }
              onPress={() => router.push('/passwords')}
              style={styles.launchBtn}
            />

            <Button
              title="Open Todo List"
              variant="secondary"
              icon={
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={colors.textPrimary}
                />
              }
              onPress={() => router.push('/todo')}
              style={styles.launchBtn}
            />
          </View>
        </Animated.View>
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
    backgroundColor: 'rgba(32, 138, 239, 0.12)',
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
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoHeroImage: {
    width: 44,
    height: 44,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statTouch: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
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
    fontSize: 11,
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
  launchButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  launchBtn: {
    flex: 1,
    height: 48,
  },
});
