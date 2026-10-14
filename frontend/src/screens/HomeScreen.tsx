import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
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
import { TodoStats } from '../types';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [stats, setStats] = useState<TodoStats>({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchTodoStats = useCallback(async () => {
    try {
      const res = await api.todos.getAll();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else if (res.success && Array.isArray(res.data)) {
        const total = res.data.length;
        const completed = res.data.filter((t) => t.completed).length;
        setStats({ total, completed, pending: total - completed });
      }
    } catch (err) {
      console.warn('Failed to load todo stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodoStats();
  }, [fetchTodoStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodoStats();
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Safe Area */}
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
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.userNameText, { color: colors.textPrimary }]}>
            {user?.name || 'User'}
          </Text>
        </View>

        <View style={styles.topActions}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.cardHover, borderColor: colors.cardBorder }]}
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
            style={[styles.iconButton, { backgroundColor: colors.cardHover, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.iconButton, styles.logoutButton, { backgroundColor: colors.dangerSoft, borderColor: 'transparent' }]}
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
        {/* Banner Card */}
        <Card style={styles.welcomeBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextCol}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                Daily Overview
              </Text>
              <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
                {stats.pending > 0
                  ? `You have ${stats.pending} task${stats.pending === 1 ? '' : 's'} pending.`
                  : 'All caught up! Excellent job.'}
              </Text>
            </View>
            <View
              style={[
                styles.bannerBadge,
                { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.12)' },
              ]}
            >
              <Ionicons name="sparkles" size={24} color="#F59E0B" />
            </View>
          </View>
        </Card>

        {/* Statistics Grid */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>
          Task Statistics
        </Text>
        <View style={styles.statsRow}>
          {/* Total */}
          <Card
            style={styles.statCard}
            variant={isDark ? 'default' : 'default'}
          >
            <Ionicons name="list" size={24} color={colors.accentSky} />
            <Text style={[styles.statCount, { color: colors.textPrimary }]}>
              {loading ? '-' : stats.total}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Tasks
            </Text>
          </Card>

          {/* Pending */}
          <Card
            style={styles.statCard}
            variant={isDark ? 'default' : 'default'}
          >
            <Ionicons name="time-outline" size={24} color={colors.warning} />
            <Text style={[styles.statCount, { color: colors.textPrimary }]}>
              {loading ? '-' : stats.pending}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Pending
            </Text>
          </Card>

          {/* Completed */}
          <Card
            style={styles.statCard}
            variant={isDark ? 'default' : 'default'}
          >
            <Ionicons name="checkmark-done-circle" size={24} color={colors.success} />
            <Text style={[styles.statCount, { color: colors.textPrimary }]}>
              {loading ? '-' : stats.completed}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Completed
            </Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>
          Quick Actions
        </Text>
        <Card style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/todo')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="checkbox-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                Manage Todos
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                View, add, edit, and organize all your tasks
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.actionDivider, { backgroundColor: colors.cardBorder }]} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconCircle,
                { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)' },
              ]}
            >
              <Ionicons name="person-outline" size={22} color={colors.accentSky} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                My Profile
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Update name, email, and theme preferences
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Primary CTA */}
        <Button
          title="Open Todo List"
          icon={<Ionicons name="add-circle-outline" size={20} color={colors.white} />}
          onPress={() => router.push('/todo')}
          style={styles.ctaButton}
        />
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
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bannerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  bannerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
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
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  actionDivider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  ctaButton: {
    marginTop: Spacing.xxl,
  },
});
