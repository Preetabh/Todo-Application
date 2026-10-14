import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import { AppVersionInfo, UpdateCheckResult } from '../types';

// In-memory session tracking for dismissed non-forced updates
let dismissedVersionInSession: string | null = null;
let lastInstallAttemptTimestamp: number | null = null;
let lastInstallAttemptVersion: string | null = null;

// Track active download resumable instance to allow cancellation
let currentDownloadTask: FileSystem.DownloadResumable | null = null;

const SNOOZE_VERSION_KEY = 'digenttech_update_snooze_version';
const SNOOZE_EXPIRY_KEY = 'digenttech_update_snooze_expiry';

/**
 * Get current running application version.
 * Tries nativeApplicationVersion first (standalone Android build),
 * then falls back to expoConfig.version from app.json.
 */
export const getCurrentAppVersion = (): string => {
  return (
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    '1.1.0'
  );
};

/**
 * Get application package / bundle identifier (e.g. com.digenttech.DigentTech)
 */
export const getAppPackageId = (): string => {
  return (
    Application.applicationId ||
    Constants.expoConfig?.android?.package ||
    'com.digenttech.DigentTech'
  );
};

/**
 * Compares two semantic version strings (e.g., '1.1.0' vs '1.0.0').
 * Returns:
 *   1 if v1 > v2 (v1 is newer)
 *  -1 if v1 < v2 (v1 is older)
 *   0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  if (!v1 || !v2) return 0;

  const clean = (v: string) =>
    v
      .replace(/^v/i, '')
      .split('-')[0] // remove pre-release tags like -alpha
      .trim();

  const parts1 = clean(v1)
    .split('.')
    .map((p) => parseInt(p, 10) || 0);
  const parts2 = clean(v2)
    .split('.')
    .map((p) => parseInt(p, 10) || 0);

  const length = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < length; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Snooze an update so it does not annoy the user with repeated popups.
 * Stores both in-memory session dismissal and persistent expiry (default 24 hours).
 */
export async function snoozeVersion(version: string, hours: number = 24): Promise<void> {
  dismissedVersionInSession = version;
  const expiry = Date.now() + hours * 60 * 60 * 1000;

  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SNOOZE_VERSION_KEY, version);
        window.localStorage.setItem(SNOOZE_EXPIRY_KEY, expiry.toString());
      }
    } else {
      await SecureStore.setItemAsync(SNOOZE_VERSION_KEY, version);
      await SecureStore.setItemAsync(SNOOZE_EXPIRY_KEY, expiry.toString());
    }
  } catch (err) {
    console.warn('Failed to persist update snooze:', err);
  }
}

/**
 * Check if a version was snoozed either in current session or within 24h snooze window.
 */
export async function isVersionSnoozed(version: string): Promise<boolean> {
  if (dismissedVersionInSession === version) {
    return true;
  }

  try {
    let savedVersion: string | null = null;
    let savedExpiry: string | null = null;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        savedVersion = window.localStorage.getItem(SNOOZE_VERSION_KEY);
        savedExpiry = window.localStorage.getItem(SNOOZE_EXPIRY_KEY);
      }
    } else {
      savedVersion = await SecureStore.getItemAsync(SNOOZE_VERSION_KEY);
      savedExpiry = await SecureStore.getItemAsync(SNOOZE_EXPIRY_KEY);
    }

    if (savedVersion === version && savedExpiry) {
      const expiryTimestamp = parseInt(savedExpiry, 10);
      if (!isNaN(expiryTimestamp) && Date.now() < expiryTimestamp) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Failed to read update snooze:', err);
  }

  return false;
}

/**
 * Record an APK installation attempt so we avoid spamming popups right after launching the installer.
 */
export function recordInstallAttempt(version: string): void {
  lastInstallAttemptVersion = version;
  lastInstallAttemptTimestamp = Date.now();
  dismissedVersionInSession = version;
}

/**
 * Check if the user recently triggered package installation within cooldown period (default 20 mins).
 */
export function hasRecentInstallAttempt(version: string, cooldownMinutes: number = 20): boolean {
  if (lastInstallAttemptVersion === version && lastInstallAttemptTimestamp) {
    const elapsed = Date.now() - lastInstallAttemptTimestamp;
    if (elapsed < cooldownMinutes * 60 * 1000) {
      return true;
    }
  }
  return false;
}

/**
 * Dismiss an update for the current app session.
 */
export function dismissVersionForSession(version: string): void {
  dismissedVersionInSession = version;
}

/**
 * Check if a version was already dismissed during this session.
 */
export function isVersionDismissedInSession(version: string): boolean {
  return dismissedVersionInSession === version;
}

/**
 * Clear all snoozes and dismissals (e.g. when user manually taps "Check for Updates").
 */
export async function clearDismissedSessionVersion(): Promise<void> {
  dismissedVersionInSession = null;
  lastInstallAttemptTimestamp = null;
  lastInstallAttemptVersion = null;

  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(SNOOZE_VERSION_KEY);
        window.localStorage.removeItem(SNOOZE_EXPIRY_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(SNOOZE_VERSION_KEY);
      await SecureStore.deleteItemAsync(SNOOZE_EXPIRY_KEY);
    }
  } catch {
    // Ignore clear errors
  }
}

/**
 * Query backend /api/app-version and determine update status.
 */
export async function checkAppUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();
  const response = await api.version.check();

  if (!response.success) {
    throw new Error(response.message || 'Unable to check for updates at this time.');
  }

  const rawInfo = (response as any) as AppVersionInfo;

  if (!rawInfo.latestVersion || !rawInfo.apkUrl) {
    throw new Error('Invalid version response payload from server.');
  }

  // Security check: Only allow HTTPS download URLs
  if (!rawInfo.apkUrl.startsWith('https://')) {
    throw new Error('Security alert: Insecure APK download URL rejected. HTTPS is required.');
  }

  const hasUpdate = compareVersions(rawInfo.latestVersion, currentVersion) > 0;
  const isForced =
    Boolean(rawInfo.forceUpdate) ||
    Boolean(rawInfo.minimumVersion && compareVersions(currentVersion, rawInfo.minimumVersion) < 0);

  return {
    hasUpdate,
    isForced,
    currentVersion,
    latestVersion: rawInfo.latestVersion,
    minimumVersion: rawInfo.minimumVersion || '1.0.0',
    apkUrl: rawInfo.apkUrl,
    updateMessage: rawInfo.updateMessage,
    releaseDate: rawInfo.releaseDate,
    fileSizeBytes: rawInfo.fileSizeBytes,
  };
}

export type DownloadProgressCallback = (
  percentage: number,
  bytesWritten: number,
  totalBytes: number
) => void;

/**
 * Download APK file from trusted HTTPS URL with progress updates,
 * convert to Android Content URI, and prompt package installer.
 */
export async function downloadAndInstallApk(
  apkUrl: string,
  targetVersion: string,
  onProgress?: DownloadProgressCallback
): Promise<{ success: boolean; uri?: string }> {
  // Security verification
  if (!apkUrl.startsWith('https://')) {
    throw new Error('Security verification failed: APK download URL must use HTTPS.');
  }

  if (Platform.OS !== 'android') {
    // Non-android fallback: open in browser
    await Linking.openURL(apkUrl);
    return { success: true };
  }

  // Ensure updates directory exists in cache directory
  const baseDir = `${FileSystem.cacheDirectory}apk-updates/`;
  const dirInfo = await FileSystem.getInfoAsync(baseDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  }

  const localFileUri = `${baseDir}DigentTech-v${targetVersion}.apk`;

  // Remove partial or previous file if exists to guarantee fresh download
  const existing = await FileSystem.getInfoAsync(localFileUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(localFileUri, { idempotent: true });
  }

  // Initiate resumable download with progress monitoring
  const downloadResumable = FileSystem.createDownloadResumable(
    apkUrl,
    localFileUri,
    {},
    (progress) => {
      const total = progress.totalBytesExpectedToWrite;
      const written = progress.totalBytesWritten;
      const percentage = total > 0 ? Math.min(1, Math.max(0, written / total)) : 0;
      if (onProgress) {
        onProgress(percentage, written, total);
      }
    }
  );

  currentDownloadTask = downloadResumable;

  try {
    const downloadResult = await downloadResumable.downloadAsync();
    currentDownloadTask = null;

    if (!downloadResult || !downloadResult.uri) {
      throw new Error('APK download was cancelled or could not be completed.');
    }

    // Verify downloaded file size
    const info = await FileSystem.getInfoAsync(downloadResult.uri);
    if (!info.exists || (info.size && info.size < 1024 * 50)) {
      throw new Error('Downloaded APK appears corrupted or incomplete.');
    }

    // Convert file:// to Android content:// URI via FileProvider
    const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

    // Launch Android Package Installer
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });

    // Mark install attempt with cooldown so app doesn't immediately re-prompt on return
    recordInstallAttempt(targetVersion);

    return { success: true, uri: downloadResult.uri };
  } catch (error: any) {
    currentDownloadTask = null;
    throw error;
  }
}

/**
 * Cancel any ongoing download task
 */
export async function cancelActiveDownload(): Promise<void> {
  if (currentDownloadTask) {
    try {
      await currentDownloadTask.pauseAsync();
    } catch {
      // Ignore pause failure during cancellation
    }
    currentDownloadTask = null;
  }
}

/**
 * Guide user to Android's "Install Unknown Apps" permission settings screen
 */
export async function openUnknownAppSourcesSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const pkg = getAppPackageId();

  try {
    // Try opening app-specific unknown sources settings (Android 8.0+)
    await IntentLauncher.startActivityAsync(
      'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
      { data: `package:${pkg}` }
    );
  } catch {
    try {
      // Fallback to application details settings
      await IntentLauncher.startActivityAsync(
        'android.settings.APPLICATION_DETAILS_SETTINGS',
        { data: `package:${pkg}` }
      );
    } catch {
      // Fallback to general security settings
      await IntentLauncher.startActivityAsync('android.settings.SECURITY_SETTINGS');
    }
  }
}

/**
 * Fallback: Open the APK directly in the device's default web browser
 */
export async function openApkInBrowser(apkUrl: string): Promise<void> {
  if (await Linking.canOpenURL(apkUrl)) {
    await Linking.openURL(apkUrl);
  }
}
