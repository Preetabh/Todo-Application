import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { Spacing, BorderRadius } from '../constants/theme';
import { UpdateCheckResult } from '../types';

export type UpdatePhase = 'idle' | 'downloading' | 'installing' | 'error';

export interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateCheckResult | null;
  phase: UpdatePhase;
  progress: number; // 0 to 1
  bytesWritten: number;
  totalBytes: number;
  errorMessage: string | null;
  onUpdateNow: () => void;
  onCancelDownload?: () => void;
  onDismiss: () => void;
  onSnooze?: (hours?: number) => void;
  onOpenSettings?: () => void;
  onOpenBrowserFallback?: () => void;
  onRetryInstall?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateInfo,
  phase,
  progress,
  bytesWritten,
  totalBytes,
  errorMessage,
  onUpdateNow,
  onCancelDownload,
  onDismiss,
  onSnooze,
  onOpenSettings,
  onOpenBrowserFallback,
  onRetryInstall,
}) => {
  const { colors, isDark } = useTheme();

  if (!visible || !updateInfo) return null;

  const isForced = updateInfo.isForced;
  const percentage = Math.round(progress * 100);

  // Format bytes to MB
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSnooze = () => {
    if (onSnooze) {
      onSnooze(24);
    } else {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!isForced && phase !== 'downloading') {
          handleSnooze();
        }
      }}
    >
      <View style={styles.overlay}>
        {/* Modal Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => {
            if (!isForced && phase !== 'downloading') {
              handleSnooze();
            }
          }}
        />

        {/* Modal Content Card */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(32, 138, 239, 0.2)',
            },
          ]}
        >
          {/* Top Close Button for optional updates */}
          {!isForced && phase !== 'downloading' && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              ]}
              onPress={handleSnooze}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Header Icon & Badges */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isForced
                    ? isDark
                      ? '#451A1A'
                      : '#FEE2E2'
                    : isDark
                    ? 'rgba(32, 138, 239, 0.2)'
                    : '#E0F2FE',
                  borderColor: isForced ? '#EF4444' : '#208AEF',
                },
              ]}
            >
              <Ionicons
                name={
                  phase === 'downloading'
                    ? 'cloud-download'
                    : phase === 'installing'
                    ? 'construct'
                    : isForced
                    ? 'alert-circle'
                    : 'sparkles'
                }
                size={30}
                color={isForced ? colors.danger : colors.primary}
              />
            </View>

            <View style={styles.headerTextCol}>
              <View style={styles.badgeRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {phase === 'downloading'
                    ? 'Downloading APK'
                    : phase === 'installing'
                    ? 'Installer Launched'
                    : isForced
                    ? 'Important Update'
                    : 'New Version Ready'}
                </Text>

                {isForced ? (
                  <View
                    style={[
                      styles.forcedBadge,
                      {
                        backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
                        borderColor: isDark ? '#B91C1C' : '#FCA5A5',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.forcedBadgeText,
                        { color: isDark ? '#FECACA' : '#991B1B' },
                      ]}
                    >
                      Required
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.releaseBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(32, 138, 239, 0.2)'
                          : 'rgba(32, 138, 239, 0.12)',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.releaseBadgeText, { color: colors.primary }]}>
                      v{updateInfo.latestVersion}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {phase === 'installing'
                  ? 'Complete the setup on your Android system prompt'
                  : 'Upgrade DigentTech to unlock latest features and fixes'}
              </Text>
            </View>
          </View>

          {/* Version Comparison Bar */}
          <View
            style={[
              styles.versionBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.versionCol}>
              <Text style={[styles.versionLabel, { color: colors.textTertiary }]}>
                Installed
              </Text>
              <Text style={[styles.versionValue, { color: colors.textSecondary }]}>
                v{updateInfo.currentVersion}
              </Text>
            </View>

            <View style={styles.versionArrowCol}>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </View>

            <View style={styles.versionCol}>
              <Text style={[styles.versionLabel, { color: colors.textTertiary }]}>
                Available
              </Text>
              <Text
                style={[
                  styles.versionValue,
                  styles.versionValueHighlight,
                  { color: colors.primary },
                ]}
              >
                v{updateInfo.latestVersion}
              </Text>
            </View>
          </View>

          {/* Feature Highlights & Release Notes */}
          <View style={styles.releaseNotesSection}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              What&apos;s Included in This Release:
            </Text>
            <ScrollView
              style={[
                styles.notesScrollView,
                {
                  backgroundColor: isDark ? '#141E33' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              contentContainerStyle={styles.notesContent}
              nestedScrollEnabled
            >
              {/* Feature Highlights Pills */}
              <View style={styles.highlightItem}>
                <Ionicons name="key" size={16} color="#3B82F6" style={styles.highlightIcon} />
                <Text style={[styles.highlightText, { color: colors.textPrimary }]}>
                  <Text style={styles.highlightBold}>Encrypted Vault: </Text>
                  AES-256-GCM secure password manager with generator.
                </Text>
              </View>

              <View style={styles.highlightItem}>
                <Ionicons name="color-palette" size={16} color="#8B5CF6" style={styles.highlightIcon} />
                <Text style={[styles.highlightText, { color: colors.textPrimary }]}>
                  <Text style={styles.highlightBold}>Adaptive Themes: </Text>
                  Polished dark & light mode with refined padding.
                </Text>
              </View>

              <View style={styles.highlightItem}>
                <Ionicons name="flash" size={16} color="#EAB308" style={styles.highlightIcon} />
                <Text style={[styles.highlightText, { color: colors.textPrimary }]}>
                  <Text style={styles.highlightBold}>Performance: </Text>
                  Silky smooth animations, compressed assets & fast startup.
                </Text>
              </View>

              {updateInfo.updateMessage ? (
                <View style={styles.customMessageContainer}>
                  <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                    {updateInfo.updateMessage}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>

          {/* Phase 1: Downloading View */}
          {phase === 'downloading' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeaderRow}>
                <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>
                  Downloading DigentTech-v{updateInfo.latestVersion}.apk
                </Text>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>
                  {percentage}%
                </Text>
              </View>

              {/* Progress Track */}
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.max(4, Math.min(100, percentage))}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressSubtextRow}>
                <Text style={[styles.progressBytes, { color: colors.textTertiary }]}>
                  {totalBytes > 0
                    ? `${formatBytes(bytesWritten)} of ${formatBytes(totalBytes)}`
                    : `${formatBytes(bytesWritten)} downloaded`}
                </Text>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>

              {!isForced && onCancelDownload && (
                <TouchableOpacity
                  onPress={onCancelDownload}
                  style={styles.cancelDownloadBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelDownloadText, { color: colors.danger }]}>
                    Cancel Download
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Phase 2: Installing View */}
          {phase === 'installing' && (
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#E0F2FE',
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
              <View style={styles.statusBannerTextCol}>
                <Text style={[styles.statusBannerTitle, { color: colors.primary }]}>
                  Android Package Installer Opened
                </Text>
                <Text style={[styles.statusBannerDesc, { color: colors.textSecondary }]}>
                  1. Tap &apos;Update&apos; on the Android system screen.{'\n'}
                  2. Once finished, reopen DigentTech from your home screen.
                </Text>
              </View>
            </View>
          )}

          {/* Phase 3: Error View */}
          {phase === 'error' && (
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  borderColor: colors.danger,
                },
              ]}
            >
              <Ionicons name="warning-outline" size={24} color={colors.danger} />
              <View style={styles.statusBannerTextCol}>
                <Text style={[styles.statusBannerTitle, { color: colors.danger }]}>
                  Installation Notice
                </Text>
                <Text style={[styles.statusBannerDesc, { color: colors.textSecondary }]}>
                  {errorMessage || 'Unable to complete installation.'}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            {phase === 'idle' && (
              <View style={styles.actionRow}>
                {!isForced && (
                  <Button
                    title="Remind Tomorrow"
                    variant="secondary"
                    icon={<Ionicons name="time-outline" size={17} color={colors.textPrimary} />}
                    onPress={handleSnooze}
                    style={styles.halfButton}
                  />
                )}
                <Button
                  title={isForced ? 'Update Required' : 'Update Now'}
                  variant="primary"
                  icon={
                    <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  }
                  onPress={onUpdateNow}
                  style={isForced ? styles.fullButton : styles.halfButton}
                />
              </View>
            )}

            {phase === 'installing' && (
              <View style={styles.actionRow}>
                <Button
                  title="Close"
                  variant="secondary"
                  onPress={handleSnooze}
                  style={styles.halfButton}
                />
                <Button
                  title="Re-open Installer"
                  variant="primary"
                  onPress={onRetryInstall || onUpdateNow}
                  style={styles.halfButton}
                  icon={
                    <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  }
                />
              </View>
            )}

            {phase === 'error' && (
              <View style={styles.errorButtonCol}>
                <Button
                  title="Retry Download"
                  variant="primary"
                  onPress={onUpdateNow}
                  style={styles.fullButton}
                />

                {Platform.OS === 'android' && onOpenSettings && (
                  <Button
                    title="Allow Unknown App Installs"
                    variant="secondary"
                    icon={
                      <Ionicons
                        name="settings-outline"
                        size={16}
                        color={colors.textPrimary}
                      />
                    }
                    onPress={onOpenSettings}
                    style={styles.fullButton}
                  />
                )}

                {onOpenBrowserFallback && (
                  <TouchableOpacity
                    onPress={onOpenBrowserFallback}
                    style={styles.browserFallbackBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.browserFallbackText,
                        { color: colors.primary },
                      ]}
                    >
                      Download APK directly in browser
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingRight: Spacing.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  releaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  releaseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  forcedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  forcedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  versionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  versionCol: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionValueHighlight: {
    fontWeight: '700',
  },
  versionArrowCol: {
    paddingHorizontal: Spacing.sm,
  },
  releaseNotesSection: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  notesScrollView: {
    maxHeight: 150,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  notesContent: {
    padding: Spacing.md,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  highlightIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  highlightText: {
    fontSize: 12.5,
    lineHeight: 17,
    flex: 1,
  },
  highlightBold: {
    fontWeight: '700',
  },
  customMessageContainer: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  notesText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBytes: {
    fontSize: 12,
  },
  cancelDownloadBtn: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  cancelDownloadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  statusBannerTextCol: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusBannerDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonStack: {
    marginTop: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  fullButton: {
    width: '100%',
  },
  errorButtonCol: {
    gap: Spacing.sm,
  },
  browserFallbackBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  browserFallbackText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
