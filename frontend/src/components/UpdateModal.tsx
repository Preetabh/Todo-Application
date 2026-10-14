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

interface UpdateModalProps {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!isForced && phase !== 'downloading') {
          onDismiss();
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
              onDismiss();
            }
          }}
        />

        {/* Modal Content Card */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
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
                    ? '#1E293B'
                    : '#E0F2FE',
                },
              ]}
            >
              <Ionicons
                name={
                  phase === 'downloading'
                    ? 'cloud-download-outline'
                    : isForced
                    ? 'alert-circle'
                    : 'sparkles'
                }
                size={28}
                color={isForced ? colors.danger : colors.primary}
              />
            </View>

            <View style={styles.headerTextCol}>
              <View style={styles.badgeRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {phase === 'downloading'
                    ? 'Downloading Update'
                    : phase === 'installing'
                    ? 'Installing Update'
                    : isForced
                    ? 'Important Update'
                    : 'Update Available'}
                </Text>

                {isForced && (
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
                )}
              </View>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                A newer version is ready for download
              </Text>
            </View>
          </View>

          {/* Version Comparison Bar */}
          <View
            style={[
              styles.versionBox,
              {
                backgroundColor: colors.cardHover,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.versionCol}>
              <Text style={[styles.versionLabel, { color: colors.textTertiary }]}>
                Current
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
                Latest
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

          {/* Release Notes / Update Message */}
          <View style={styles.releaseNotesSection}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              What&apos;s New
            </Text>
            <ScrollView
              style={[
                styles.notesScrollView,
                {
                  backgroundColor: isDark ? '#141E33' : '#F8FAFC',
                  borderColor: colors.cardBorder,
                },
              ]}
              contentContainerStyle={styles.notesContent}
              nestedScrollEnabled
            >
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                {updateInfo.updateMessage ||
                  'Performance enhancements, security updates, and bug fixes.'}
              </Text>
            </ScrollView>
          </View>

          {/* Phase 1: Downloading View */}
          {phase === 'downloading' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeaderRow}>
                <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>
                  Downloading APK...
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
                    ? `${formatBytes(bytesWritten)} / ${formatBytes(totalBytes)}`
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
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <View style={styles.statusBannerTextCol}>
                <Text style={[styles.statusBannerTitle, { color: colors.primary }]}>
                  Opening Android Installer...
                </Text>
                <Text style={[styles.statusBannerDesc, { color: colors.textSecondary }]}>
                  Confirm installation when prompted on screen.
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
                  backgroundColor: colors.dangerSoft,
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
                    title="Later"
                    variant="secondary"
                    onPress={onDismiss}
                    style={styles.halfButton}
                  />
                )}
                <Button
                  title={isForced ? 'Update to Continue' : 'Update Now'}
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
                  title="Launch Installer Again"
                  variant="primary"
                  onPress={onRetryInstall || onUpdateNow}
                  style={styles.fullButton}
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
                      Download directly in browser
                    </Text>
                  </TouchableOpacity>
                )}

                {!isForced && (
                  <Button
                    title="Close"
                    variant="ghost"
                    onPress={onDismiss}
                    style={styles.fullButton}
                  />
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
    paddingHorizontal: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  forcedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  forcedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  versionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  versionCol: {
    alignItems: 'center',
  },
  versionArrowCol: {
    paddingHorizontal: Spacing.sm,
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  versionValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  versionValueHighlight: {
    fontWeight: '800',
  },
  releaseNotesSection: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notesScrollView: {
    maxHeight: 110,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  notesContent: {
    padding: Spacing.md,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 19,
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
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
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
    alignSelf: 'center',
    marginTop: Spacing.sm,
    paddingVertical: 4,
  },
  cancelDownloadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statusBannerTextCol: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBannerDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  buttonStack: {
    marginTop: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  browserFallbackText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
