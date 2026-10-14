import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { StoredDocument } from '../types';
import { useTheme } from '../hooks/useTheme';
import { documentStorage, formatBytes } from '../services/documentStorage';
import { Spacing, BorderRadius } from '../constants/theme';
import { Button } from './Button';

interface DocumentViewerModalProps {
  visible: boolean;
  document: StoredDocument | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (doc: StoredDocument) => void;
  onToggleFavorite: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  visible,
  document,
  onClose,
  onDelete,
  onEdit,
  onToggleFavorite,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMaskedNumber, setShowMaskedNumber] = useState(true);

  if (!document) return null;

  const handleShare = async () => {
    setSharing(true);
    try {
      await documentStorage.shareDocument(document);
    } catch (err: any) {
      Alert.alert('Share Failed', err.message || 'Unable to share document.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyNumber = async () => {
    if (!document.documentNumber) return;
    await Clipboard.setStringAsync(document.documentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedNumber = (num?: string) => {
    if (!num) return '';
    if (num.length <= 4) return num;
    const lastFour = num.slice(-4);
    const hidden = '•'.repeat(Math.min(num.length - 4, 8));
    return `${hidden} ${lastFour}`;
  };

  const isImage = document.fileType === 'image';
  const isPdf = document.fileType === 'pdf';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: Platform.OS === 'ios' ? insets.top : Spacing.md,
          },
        ]}
      >
        {/* Top Navigation Bar */}
        <View
          style={[
            styles.headerBar,
            {
              borderBottomColor: colors.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: colors.cardHover }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {document.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {document.category.toUpperCase()} • {formatBytes(document.fileSizeBytes)}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            {/* Favorite / Pin */}
            <TouchableOpacity
              style={[
                styles.circleBtn,
                {
                  backgroundColor: document.isFavorite
                    ? 'rgba(245, 158, 11, 0.15)'
                    : colors.cardHover,
                },
              ]}
              onPress={() => onToggleFavorite(document.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={document.isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={document.isFavorite ? '#F59E0B' : colors.textPrimary}
              />
            </TouchableOpacity>

            {/* Quick Share Button */}
            <TouchableOpacity
              style={[
                styles.circleBtn,
                { backgroundColor: colors.primarySoft },
              ]}
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social" size={20} color={colors.primary} />
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
          showsVerticalScrollIndicator={false}
        >
          {/* Main Visual Preview */}
          <View
            style={[
              styles.previewContainer,
              {
                backgroundColor: isDark ? '#111827' : '#F1F5F9',
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {isImage ? (
              <Image
                source={{ uri: document.fileUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.nonImagePreview}>
                <View
                  style={[
                    styles.fileIconBig,
                    {
                      backgroundColor: isPdf
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(99, 102, 241, 0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name={isPdf ? 'document-text' : 'folder-open'}
                    size={48}
                    color={isPdf ? '#EF4444' : colors.primary}
                  />
                </View>
                <Text
                  style={[styles.previewFileName, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {document.fileName}
                </Text>
                <Text style={[styles.previewFileType, { color: colors.textSecondary }]}>
                  {isPdf ? 'Portable Document Format (PDF)' : 'Stored Document File'}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.previewOpenBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleShare}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.previewOpenBtnText}>Open / Export File</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quick Share Callout Banner */}
          <View
            style={[
              styles.shareHighlightBanner,
              {
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'rgba(79, 70, 229, 0.08)',
                borderColor: isDark
                  ? 'rgba(99, 102, 241, 0.4)'
                  : 'rgba(79, 70, 229, 0.25)',
              },
            ]}
          >
            <View style={styles.shareHighlightLeft}>
              <View
                style={[
                  styles.shareIconCircle,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.shareHighlightTextCol}>
                <Text
                  style={[styles.shareHighlightTitle, { color: colors.textPrimary }]}
                >
                  Instant Document Share
                </Text>
                <Text
                  style={[
                    styles.shareHighlightSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Share directly to WhatsApp, Email, Drive or Bluetooth
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.shareActionButton, { backgroundColor: colors.primary }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.shareActionText}>Share</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Document Number Card (If Available) */}
          {document.documentNumber ? (
            <View
              style={[
                styles.detailCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.detailCardHeader}>
                <View style={styles.detailCardLabelWrap}>
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.detailCardLabel, { color: colors.textSecondary }]}
                  >
                    DOCUMENT NUMBER / ID
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowMaskedNumber(!showMaskedNumber)}
                  style={styles.eyeToggleBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showMaskedNumber ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.eyeToggleText, { color: colors.textSecondary }]}
                  >
                    {showMaskedNumber ? 'Reveal' : 'Mask'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.numberRow}>
                <Text
                  style={[
                    styles.documentNumberText,
                    { color: colors.textPrimary },
                  ]}
                  selectable
                >
                  {showMaskedNumber
                    ? maskedNumber(document.documentNumber)
                    : document.documentNumber}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.copyNumberBtn,
                    {
                      backgroundColor: copied
                        ? colors.successSoft
                        : colors.cardHover,
                      borderColor: copied ? colors.success : colors.cardBorder,
                    },
                  ]}
                  onPress={handleCopyNumber}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={copied ? colors.success : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.copyNumberBtnText,
                      {
                        color: copied ? colors.success : colors.textPrimary,
                      },
                    ]}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Document Properties Grid */}
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.textPrimary }]}
            >
              Document Information
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                  Category
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {document.category.toUpperCase()}
                </Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                  File Format
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {document.fileType.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                  File Size
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {formatBytes(document.fileSizeBytes)}
                </Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                  Saved On Device
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {new Date(document.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {(document.issueDate || document.expiryDate) && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: colors.cardBorder }]}
                />
                <View style={styles.metaRow}>
                  {document.issueDate && (
                    <View style={styles.metaCol}>
                      <Text
                        style={[styles.metaLabel, { color: colors.textTertiary }]}
                      >
                        Issue Date
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: colors.textPrimary }]}
                      >
                        {document.issueDate}
                      </Text>
                    </View>
                  )}
                  {document.expiryDate && (
                    <View style={styles.metaCol}>
                      <Text
                        style={[styles.metaLabel, { color: colors.textTertiary }]}
                      >
                        Expiry Date
                      </Text>
                      <Text
                        style={[
                          styles.metaValue,
                          {
                            color:
                              new Date(document.expiryDate).getTime() <
                              Date.now()
                                ? colors.danger
                                : colors.textPrimary,
                          },
                        ]}
                      >
                        {document.expiryDate}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {document.notes && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: colors.cardBorder }]}
                />
                <View style={{ paddingTop: Spacing.sm }}>
                  <Text
                    style={[styles.metaLabel, { color: colors.textTertiary }]}
                  >
                    Notes & Remarks
                  </Text>
                  <Text
                    style={[styles.notesText, { color: colors.textSecondary }]}
                  >
                    {document.notes}
                  </Text>
                </View>
              </>
            )}

            {/* Offline Storage Notice */}
            <View
              style={[
                styles.offlineNotice,
                {
                  backgroundColor: colors.cardHover,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={colors.success}
              />
              <Text
                style={[styles.offlineNoticeText, { color: colors.textSecondary }]}
              >
                100% on-device local storage. No cloud upload, completely private.
              </Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsFooterRow}>
            <Button
              title="Edit Details"
              variant="secondary"
              icon={
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.textPrimary}
                />
              }
              onPress={() => onEdit(document)}
              style={styles.actionFooterBtn}
            />

            <Button
              title="Delete"
              variant="danger"
              icon={
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.white}
                />
              }
              onPress={() => onDelete(document.id)}
              style={styles.actionFooterBtn}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  previewContainer: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: SCREEN_WIDTH - Spacing.lg * 2 - 2,
    height: 320,
    backgroundColor: 'transparent',
  },
  nonImagePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  fileIconBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewFileName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewFileType: {
    fontSize: 13,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  previewOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.round,
  },
  previewOpenBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  shareHighlightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  shareHighlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shareIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  shareHighlightTextCol: {
    flex: 1,
  },
  shareHighlightTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shareHighlightSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  shareActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    marginLeft: Spacing.sm,
  },
  shareActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailCardLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eyeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyeToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  documentNumberText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  copyNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  copyNumberBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  offlineNoticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  actionsFooterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionFooterBtn: {
    flex: 1,
    height: 48,
  },
});
