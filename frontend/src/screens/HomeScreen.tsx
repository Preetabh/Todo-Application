import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { TodoStats } from '../types';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.userSection}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userNameText}>{user?.name || 'User'}</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={32} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, styles.logoutButton]}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Banner Card */}
        <Card style={styles.welcomeBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Daily Overview</Text>
              <Text style={styles.bannerSubtitle}>
                {stats.pending > 0
                  ? `You have ${stats.pending} task${stats.pending === 1 ? '' : 's'} pending.`
                  : 'All caught up! Excellent job.'}
              </Text>
            </View>
            <View style={styles.bannerBadge}>
              <Ionicons name="sparkles" size={24} color="#FBBF24" />
            </View>
          </View>
        </Card>

        {/* Statistics Grid */}
        <Text style={styles.sectionHeader}>Task Statistics</Text>
        <View style={styles.statsRow}>
          {/* Total */}
          <Card style={[styles.statCard, styles.totalCard]}>
            <Ionicons name="list" size={24} color={Colors.accentSky} />
            <Text style={styles.statCount}>{loading ? '-' : stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </Card>

          {/* Pending */}
          <Card style={[styles.statCard, styles.pendingCard]}>
            <Ionicons name="time-outline" size={24} color={Colors.warning} />
            <Text style={styles.statCount}>{loading ? '-' : stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>

          {/* Completed */}
          <Card style={[styles.statCard, styles.completedCard]}>
            <Ionicons name="checkmark-done-circle" size={24} color={Colors.success} />
            <Text style={styles.statCount}>{loading ? '-' : stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <Card style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/todo')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: Colors.primarySoft }]}>
              <Ionicons name="checkbox-outline" size={22} color={Colors.primaryLight} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Manage Todos</Text>
              <Text style={styles.actionDescription}>
                View, add, edit, and organize all your tasks
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="person-outline" size={22} color={Colors.accentSky} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>My Profile</Text>
              <Text style={styles.actionDescription}>
                Update name, email, and account settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Primary CTA */}
        <Button
          title="Open Todo List"
          icon={<Ionicons name="add-circle-outline" size={20} color={Colors.white} />}
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
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  userSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  logoutButton: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: BorderRadius.round,
    padding: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  welcomeBanner: {
    marginTop: Spacing.md,
    backgroundColor: '#16223B',
    borderColor: '#26375E',
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
    color: Colors.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  bannerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  totalCard: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  pendingCard: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  completedCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statCount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: Spacing.lg,
  },
  ctaButton: {
    marginTop: Spacing.xxl,
  },
});
