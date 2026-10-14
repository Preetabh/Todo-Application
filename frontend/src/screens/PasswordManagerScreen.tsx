import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { PasswordCard } from '../components/PasswordCard';
import { PasswordModal } from '../components/PasswordModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Spacing, BorderRadius } from '../constants/theme';
import { PasswordItem, PasswordCategory } from '../types';

type CategoryFilter = 'all' | 'favorites' | PasswordCategory;

export const PasswordManagerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [passwords, setPasswords] = useState<PasswordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  // Modals & Feedback
  const [showModal, setShowModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PasswordItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchPasswords = useCallback(async () => {
    try {
      const res = await api.passwords.getAll();
      if (res.success && Array.isArray(res.data)) {
        setPasswords(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load password vault:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPasswords();
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 2800);
  };

  // Filtered list
  const filteredPasswords = useMemo(() => {
    return passwords.filter((item) => {
      // Category filter
      if (activeCategory === 'favorites') {
        if (!item.isFavorite) return false;
      } else if (activeCategory !== 'all') {
        if (item.category !== activeCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const userMatch = item.username?.toLowerCase().includes(q);
        const webMatch = item.website?.toLowerCase().includes(q);
        return titleMatch || userMatch || webMatch;
      }

      return true;
    });
  }, [passwords, activeCategory, searchQuery]);

  // Handle Save (Create or Update)
  const handleSavePassword = async (data: any) => {
    setSaving(true);
    try {
      if (itemToEdit) {
        const res = await api.passwords.update(itemToEdit._id, data);
        if (res.success && res.data) {
          setPasswords((prev) =>
            prev.map((p) => (p._id === itemToEdit._id ? res.data! : p))
          );
          showToast('Password updated securely!');
          setShowModal(false);
          setItemToEdit(null);
        } else {
          showToast(res.message || 'Failed to update password', 'error');
        }
      } else {
        const res = await api.passwords.create(data);
        if (res.success && res.data) {
          setPasswords((prev) => [res.data!, ...prev]);
          showToast('Password stored securely!');
          setShowModal(false);
        } else {
          showToast(res.message || 'Failed to create password', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (item: PasswordItem) => {
    const updatedStatus = !item.isFavorite;
    // Optimistic UI update
    setPasswords((prev) =>
      prev.map((p) =>
        p._id === item._id ? { ...p, isFavorite: updatedStatus } : p
      )
    );

    try {
      await api.passwords.update(item._id, { isFavorite: updatedStatus });
    } catch {
      // Revert on failure
      setPasswords((prev) =>
        prev.map((p) =>
          p._id === item._id ? { ...p, isFavorite: !updatedStatus } : p
        )
      );
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeleteTargetId(null);

    try {
      const res = await api.passwords.delete(targetId);
      if (res.success) {
        setPasswords((prev) => prev.filter((p) => p._id !== targetId));
        showToast('Password deleted from vault');
      } else {
        showToast(res.message || 'Failed to delete password', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete password', 'error');
    }
  };

  const categories: { key: CategoryFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'favorites', label: 'Favorites', icon: 'star-outline' },
    { key: 'login', label: 'Logins', icon: 'key-outline' },
    { key: 'finance', label: 'Finance', icon: 'wallet-outline' },
    { key: 'social', label: 'Social', icon: 'chatbubbles-outline' },
    { key: 'work', label: 'Work', icon: 'briefcase-outline' },
    { key: 'card', label: 'Cards', icon: 'card-outline' },
    { key: 'other', label: 'Other', icon: 'shield-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Password Vault"
        showBack
        onBack={() => router.back()}
        showThemeToggle
        rightAction={
          <TouchableOpacity
            style={[
              styles.addHeaderBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              setItemToEdit(null);
              setShowModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Toast Feedback Banner */}
      {feedback && (
        <View
          style={[
            styles.toastBanner,
            {
              backgroundColor:
                feedback.type === 'success'
                  ? colors.successSoft
                  : colors.dangerSoft,
              borderColor:
                feedback.type === 'success' ? colors.success : colors.danger,
            },
          ]}
        >
          <Ionicons
            name={
              feedback.type === 'success'
                ? 'checkmark-circle-outline'
                : 'alert-circle-outline'
            }
            size={18}
            color={feedback.type === 'success' ? colors.success : colors.danger}
          />
          <Text
            style={[
              styles.toastText,
              {
                color:
                  feedback.type === 'success' ? colors.success : colors.danger,
              },
            ]}
          >
            {feedback.text}
          </Text>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            placeholder="Search accounts, services, emails..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Category Filter Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {categories.map((c) => {
            const isSelected = activeCategory === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.card,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.cardBorder,
                  },
                ]}
                onPress={() => setActiveCategory(c.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={c.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Vault List */}
      {loading ? (
        <LoadingSpinner message="Decrypting your vault..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
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
          {filteredPasswords.length === 0 ? (
            <EmptyState
              title={
                searchQuery
                  ? 'No Matching Passwords'
                  : activeCategory === 'favorites'
                  ? 'No Pinned Passwords'
                  : 'Vault is Empty'
              }
              description={
                searchQuery
                  ? `No credentials found matching "${searchQuery}".`
                  : 'Keep your accounts protected with AES-256-GCM encryption. Tap the + button to save your first credential.'
              }
              actionTitle="Add New Password"
              onAction={() => {
                setItemToEdit(null);
                setShowModal(true);
              }}
            />
          ) : (
            filteredPasswords.map((item) => (
              <PasswordCard
                key={item._id}
                item={item}
                onEdit={(it) => {
                  setItemToEdit(it);
                  setShowModal(true);
                }}
                onDelete={(id) => setDeleteTargetId(id)}
                onToggleFavorite={handleToggleFavorite}
                onCopied={(msg) => showToast(msg)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Add / Edit Password Modal */}
      <PasswordModal
        visible={showModal}
        itemToEdit={itemToEdit}
        onClose={() => {
          setShowModal(false);
          setItemToEdit(null);
        }}
        onSave={handleSavePassword}
        loading={saving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(deleteTargetId)}
        title="Delete Credential"
        message="Are you sure you want to permanently delete this password from your vault? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
};

export default PasswordManagerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterSection: {
    paddingVertical: Spacing.md,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    gap: 6,
  },
  filterPillText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
  },
});
