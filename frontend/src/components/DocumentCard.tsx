import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { StoredDocument } from '../types';
import { useTheme } from '../hooks/useTheme';
import { formatBytes } from '../services/documentStorage';
import { Spacing, BorderRadius } from '../constants/theme';
import { Card } from './Card';

interface DocumentCardProps {
  document: StoredDocument;
  onPress: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
}

const CATEGORY_COLORS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bgDark: string; bgLight: string }> = {
  identity: { icon: 'id-card-outline', color: '#3B82F6', bgDark: 'rgba(59, 130, 246, 0.15)', bgLight: '#EFF6FF' },
  education: { icon: 'school-outline', color: '#8B5CF6', bgDark: 'rgba(139, 92, 246, 0.15)', bgLight: '#F5F3FF' },
  finance: { icon: 'wallet-outline', color: '#10B981', bgDark: 'rgba(16, 185, 129, 0.15)', bgLight: '#ECFDF5' },
  health: { icon: 'medkit-outline', color: '#EC4899', bgDark: 'rgba(236, 72, 153, 0.15)', bgLight: '#FDF2F8' },
  vehicle: { icon: 'car-outline', color: '#F59E0B', bgDark: 'rgba(245, 158, 11, 0.15)', bgLight: '#FFFBEB' },
  bills: { icon: 'receipt-outline', color: '#06B6D4', bgDark: 'rgba(6, 182, 212, 0.15)', bgLight: '#ECFEFF' },
  other: { icon: 'folder-open-outline', color: '#64748B', bgDark: 'rgba(100, 116, 139, 0.15)', bgLight: '#F1F5F9' },
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPress,
  onShare,
  onToggleFavorite,
}) => {
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = React.useState(false);

  const catMeta = CATEGORY_COLORS[document.category] || CATEGORY_COLORS.other;

  const handleCopyNumber = async (e: any) => {
    e?.stopPropagation?.();
    if (!document.documentNumber) return;
    await Clipboard.setStringAsync(document.documentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPdf = document.fileType === 'pdf';

  return (
    <Card style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.touchableArea}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.topRow}>
          {/* Category Icon Badge */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: isDark ? catMeta.bgDark : catMeta.bgLight,
              },
            ]}
          >
            <Ionicons name={catMeta.icon} size={22} color={catMeta.color} />
          </View>

          {/* Title & Metadata Column */}
          <View style={styles.titleCol}>
            <View style={styles.titleHeader}>
              <Text
                style={[styles.titleText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {document.title}
              </Text>
              {document.isFavorite && (
                <Ionicons name="star" size={14} color="#F59E0B" />
              )}
            </View>

            <View style={styles.tagsRow}>
              {/* Category Tag */}
              <View
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  },
                ]}
              >
                <Text
                  style={[styles.categoryPillText, { color: colors.textSecondary }]}
                >
                  {document.category.toUpperCase()}
                </Text>
              </View>

              {/* Format Badge */}
              <View
                style={[
                  styles.formatPill,
                  {
                    backgroundColor: isPdf
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(59, 130, 246, 0.12)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.formatPillText,
                    { color: isPdf ? '#EF4444' : '#3B82F6' },
                  ]}
                >
                  {document.fileType.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.sizeText, { color: colors.textTertiary }]}>
                {formatBytes(document.fileSizeBytes)}
              </Text>
            </View>
          </View>

          {/* Actions: Pin Star & Share */}
          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={[
                styles.iconActionBtn,
                {
                  backgroundColor: document.isFavorite
                    ? 'rgba(245, 158, 11, 0.15)'
                    : colors.cardHover,
                },
              ]}
              onPress={(e) => {
                e?.stopPropagation?.();
                onToggleFavorite();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={document.isFavorite ? 'star' : 'star-outline'}
                size={16}
                color={document.isFavorite ? '#F59E0B' : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconActionBtn,
                { backgroundColor: colors.primarySoft },
              ]}
              onPress={(e) => {
                e?.stopPropagation?.();
                onShare();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Document Number Strip if exists */}
        {document.documentNumber && (
          <View
            style={[
              styles.numberStrip,
              {
                backgroundColor: colors.cardHover,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.numberWrap}>
              <Ionicons name="keypad-outline" size={14} color={colors.textTertiary} />
              <Text
                style={[styles.numberValue, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {document.documentNumber}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.copySmallBtn}
              onPress={handleCopyNumber}
              activeOpacity={0.6}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copied ? colors.success : colors.primary}
              />
              <Text
                style={[
                  styles.copySmallText,
                  { color: copied ? colors.success : colors.primary },
                ]}
              >
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer info: Added date or expiration tag */}
        <View style={styles.cardFooter}>
          <Text style={[styles.footerDate, { color: colors.textTertiary }]}>
            Saved on {new Date(document.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>

          <View style={styles.viewDocHint}>
            <Text style={[styles.viewDocHintText, { color: colors.primary }]}>
              View / Open
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 0,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  touchableArea: {
    padding: Spacing.md + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  formatPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  formatPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sizeText: {
    fontSize: 11,
    marginLeft: 2,
  },
  actionButtonsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  numberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  numberValue: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  copySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacing.sm,
  },
  copySmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
  },
  footerDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  viewDocHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDocHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
