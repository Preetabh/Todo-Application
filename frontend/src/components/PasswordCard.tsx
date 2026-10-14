import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../hooks/useTheme';
import { Card } from './Card';
import { Spacing, BorderRadius } from '../constants/theme';
import { PasswordItem, PasswordCategory } from '../types';

interface PasswordCardProps {
  item: PasswordItem;
  onEdit: (item: PasswordItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (item: PasswordItem) => void;
  onCopied?: (label: string) => void;
}

const CATEGORY_ICONS: Record<
  PasswordCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  login: { icon: 'key', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  finance: { icon: 'wallet', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  social: { icon: 'chatbubbles', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
  work: { icon: 'briefcase', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  card: { icon: 'card', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  other: { icon: 'shield-checkmark', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' },
};

export const PasswordCard: React.FC<PasswordCardProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopied,
}) => {
  const { colors, isDark } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  const catMeta = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;

  const handleCopyPassword = async () => {
    if (!item.password) return;
    await Clipboard.setStringAsync(item.password);
    setCopiedPassword(true);
    if (onCopied) onCopied('Password copied to clipboard!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyUsername = async () => {
    if (!item.username) return;
    await Clipboard.setStringAsync(item.username);
    setCopiedUsername(true);
    if (onCopied) onCopied('Username copied to clipboard!');
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const handleOpenWebsite = () => {
    if (!item.website) return;
    const url = item.website.startsWith('http')
      ? item.website
      : `https://${item.website}`;
    Linking.openURL(url).catch(() => {});
  };

  const strengthColor =
    item.strength?.label === 'Very Strong'
      ? '#10B981'
      : item.strength?.label === 'Strong'
      ? '#3B82F6'
      : item.strength?.label === 'Medium'
      ? '#F59E0B'
      : '#EF4444';

  return (
    <Card style={styles.cardContainer}>
      {/* Top Row: Category Icon, Title, Favorite & Actions */}
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.categoryIconCircle, { backgroundColor: catMeta.bg }]}>
            <Ionicons name={catMeta.icon} size={20} color={catMeta.color} />
          </View>

          <View style={styles.titleCol}>
            <View style={styles.titleBadgeRow}>
              <Text
                style={[styles.itemTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.strength && (
                <View
                  style={[
                    styles.strengthBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: strengthColor,
                    },
                  ]}
                >
                  <Text style={[styles.strengthBadgeText, { color: strengthColor }]}>
                    {item.strength.label}
                  </Text>
                </View>
              )}
            </View>

            {item.website ? (
              <TouchableOpacity
                onPress={handleOpenWebsite}
                style={styles.websiteRow}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.websiteText, { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {item.website.replace(/^https?:\/\//i, '')}
                </Text>
                <Ionicons
                  name="open-outline"
                  size={12}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Favorite & Options */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => onToggleFavorite(item)}
            style={styles.iconActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={item.isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={item.isFavorite ? '#F59E0B' : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Username Row */}
      {item.username ? (
        <View
          style={[
            styles.credentialBox,
            {
              backgroundColor: colors.cardHover,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.credentialTextCol}>
            <Text style={[styles.fieldMiniLabel, { color: colors.textTertiary }]}>
              Username / Email
            </Text>
            <Text
              style={[styles.credentialValue, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.username}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCopyUsername}
            style={[
              styles.copyBtn,
              {
                backgroundColor: copiedUsername
                  ? colors.successSoft
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#E2E8F0',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copiedUsername ? 'checkmark' : 'copy-outline'}
              size={15}
              color={copiedUsername ? colors.success : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Password Row */}
      <View
        style={[
          styles.credentialBox,
          {
            backgroundColor: colors.cardHover,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.credentialTextCol}>
          <Text style={[styles.fieldMiniLabel, { color: colors.textTertiary }]}>
            Password
          </Text>
          <Text
            style={[
              styles.credentialValue,
              {
                color: colors.textPrimary,
                letterSpacing: showPassword ? 0.5 : 2,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              },
            ]}
            numberOfLines={1}
          >
            {showPassword ? item.password : '••••••••••••'}
          </Text>
        </View>

        <View style={styles.buttonButtonGroup}>
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={[
              styles.copyBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#E2E8F0',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCopyPassword}
            style={[
              styles.copyBtn,
              {
                backgroundColor: copiedPassword
                  ? colors.successSoft
                  : colors.primarySoft,
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copiedPassword ? 'checkmark' : 'copy-outline'}
              size={15}
              color={copiedPassword ? colors.success : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Notes (if any) */}
      {item.notes ? (
        <View
          style={[
            styles.notesContainer,
            { backgroundColor: isDark ? '#141E33' : '#F8FAFC' },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={14}
            color={colors.textTertiary}
          />
          <Text
            style={[styles.notesText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.notes}
          </Text>
        </View>
      ) : null}

      {/* Card Footer Actions */}
      <View
        style={[
          styles.footerRow,
          { borderTopColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.dateText, { color: colors.textTertiary }]}>
          Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
        </Text>

        <View style={styles.footerActionButtons}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={[styles.smallActionBtn, { backgroundColor: colors.cardHover }]}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={[styles.smallActionText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(item._id)}
            style={[styles.smallActionBtn, { backgroundColor: colors.dangerSoft }]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[styles.smallActionText, { color: colors.danger }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  categoryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleCol: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  strengthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  strengthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  websiteText: {
    fontSize: 12,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconActionBtn: {
    padding: 4,
  },
  credentialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  credentialTextCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  fieldMiniLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  credentialValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  notesText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: 11,
  },
  footerActionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
