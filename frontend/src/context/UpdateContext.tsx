import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  checkAppUpdate,
  downloadAndInstallApk,
  cancelActiveDownload,
  snoozeVersion,
  isVersionSnoozed,
  hasRecentInstallAttempt,
  clearDismissedSessionVersion,
  openUnknownAppSourcesSettings,
  openApkInBrowser,
  getCurrentAppVersion,
} from '../services/updater';
import { UpdateCheckResult } from '../types';
import { UpdateModal, UpdatePhase } from '../components/UpdateModal';

interface UpdateContextType {
  updateInfo: UpdateCheckResult | null;
  isChecking: boolean;
  phase: UpdatePhase;
  progress: number;
  bytesWritten: number;
  totalBytes: number;
  errorMessage: string | null;
  showModal: boolean;
  currentVersion: string;
  checkForUpdates: (manual?: boolean) => Promise<UpdateCheckResult | null>;
  openUpdateModal: () => void;
  startUpdate: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  dismissModal: () => void;
  snoozeUpdate: (hours?: number) => Promise<void>;
  openSettings: () => Promise<void>;
  openBrowserFallback: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

// Periodic check interval: 30 minutes while app is active
const PERIODIC_CHECK_INTERVAL_MS = 30 * 60 * 1000;
// Minimum cooldown between automatic AppState switch checks (5 minutes)
const APP_STATE_CHECK_COOLDOWN_MS = 5 * 60 * 1000;

export const UpdateProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [bytesWritten, setBytesWritten] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isUpdatingRef = useRef<boolean>(false);
  const lastCheckTimestampRef = useRef<number>(0);

  const currentVersion = getCurrentAppVersion();

  /**
   * Check for updates with support for background / periodic vs user-initiated checks
   */
  const checkForUpdates = useCallback(
    async (manual = false): Promise<UpdateCheckResult | null> => {
      // Don't interrupt if currently downloading
      if (isUpdatingRef.current) return null;

      if (manual) {
        await clearDismissedSessionVersion();
      }

      setIsChecking(true);
      lastCheckTimestampRef.current = Date.now();

      try {
        const result = await checkAppUpdate();
        setUpdateInfo(result);

        if (result.hasUpdate) {
          if (!manual) {
            // Check if user recently triggered install (e.g. package installer opened)
            if (hasRecentInstallAttempt(result.latestVersion)) {
              return result;
            }

            // Check if user snoozed this version (and it's not a required update)
            const isSnoozed = await isVersionSnoozed(result.latestVersion);
            if (isSnoozed && !result.isForced) {
              return result;
            }
          }

          // Show modal
          setPhase('idle');
          setErrorMessage(null);
          setShowModal(true);
        } else if (manual) {
          // No update available on manual check
          setShowModal(false);
        }

        return result;
      } catch (err: any) {
        if (manual) {
          throw err;
        }
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  /**
   * Manually open the update modal if an update exists
   */
  const openUpdateModal = useCallback(() => {
    if (updateInfo?.hasUpdate) {
      setPhase('idle');
      setErrorMessage(null);
      setShowModal(true);
    } else {
      checkForUpdates(true);
    }
  }, [updateInfo, checkForUpdates]);

  /**
   * Begin APK download and trigger installer
   */
  const startUpdate = useCallback(async () => {
    if (!updateInfo) return;

    isUpdatingRef.current = true;
    setPhase('downloading');
    setProgress(0);
    setBytesWritten(0);
    setTotalBytes(0);
    setErrorMessage(null);

    try {
      await downloadAndInstallApk(
        updateInfo.apkUrl,
        updateInfo.latestVersion,
        (pct, written, total) => {
          setProgress(pct);
          setBytesWritten(written);
          setTotalBytes(total);
        }
      );

      // Package installer opened successfully
      setPhase('installing');
    } catch (err: any) {
      setPhase('error');
      const msg =
        err.message?.includes('Permission') || err.message?.includes('REQUEST_INSTALL_PACKAGES')
          ? 'Android requires permission to install apps from this source. Please grant permission in settings and try again.'
          : err.message || 'Failed to download or install the update.';
      setErrorMessage(msg);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [updateInfo]);

  /**
   * Cancel an ongoing download
   */
  const cancelDownload = useCallback(async () => {
    await cancelActiveDownload();
    isUpdatingRef.current = false;
    setPhase('idle');
    setProgress(0);
  }, []);

  /**
   * Dismiss the modal for now (and snooze for 24h)
   */
  const dismissModal = useCallback(() => {
    if (updateInfo && !updateInfo.isForced) {
      snoozeVersion(updateInfo.latestVersion, 24).catch(() => {});
    }
    setShowModal(false);
    setPhase('idle');
  }, [updateInfo]);

  /**
   * Snooze update reminders for specified hours (default 24 hours)
   */
  const snoozeUpdate = useCallback(
    async (hours = 24) => {
      if (updateInfo && !updateInfo.isForced) {
        await snoozeVersion(updateInfo.latestVersion, hours);
      }
      setShowModal(false);
      setPhase('idle');
    },
    [updateInfo]
  );

  /**
   * Open Android unknown app settings
   */
  const openSettings = useCallback(async () => {
    await openUnknownAppSourcesSettings();
  }, []);

  /**
   * Open APK in browser as fallback
   */
  const openBrowserFallback = useCallback(async () => {
    if (updateInfo?.apkUrl) {
      await openApkInBrowser(updateInfo.apkUrl);
    }
  }, [updateInfo]);

  // Initial check on app launch + periodic polling
  useEffect(() => {
    // 1. Initial check after slight delay to ensure UI renders first
    const initTimer = setTimeout(() => {
      checkForUpdates(false);
    }, 1500);

    // 2. Periodic background check timer
    const intervalTimer = setInterval(() => {
      if (appStateRef.current === 'active') {
        checkForUpdates(false);
      }
    }, PERIODIC_CHECK_INTERVAL_MS);

    // 3. AppState change listener (e.g. user returns to app from background)
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const isReturningToActive =
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active';

        if (isReturningToActive) {
          const now = Date.now();
          const cooldownElapsed =
            now - lastCheckTimestampRef.current >= APP_STATE_CHECK_COOLDOWN_MS;

          // Only recheck if cooldown elapsed and not currently in the middle of updating
          if (cooldownElapsed && !isUpdatingRef.current) {
            checkForUpdates(false);
          }
        }
        appStateRef.current = nextAppState;
      }
    );

    return () => {
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
      subscription.remove();
    };
  }, [checkForUpdates]);

  return (
    <UpdateContext.Provider
      value={{
        updateInfo,
        isChecking,
        phase,
        progress,
        bytesWritten,
        totalBytes,
        errorMessage,
        showModal,
        currentVersion,
        checkForUpdates,
        openUpdateModal,
        startUpdate,
        cancelDownload,
        dismissModal,
        snoozeUpdate,
        openSettings,
        openBrowserFallback,
      }}
    >
      {children}

      {/* Render UpdateModal globally */}
      <UpdateModal
        visible={showModal}
        updateInfo={updateInfo}
        phase={phase}
        progress={progress}
        bytesWritten={bytesWritten}
        totalBytes={totalBytes}
        errorMessage={errorMessage}
        onUpdateNow={startUpdate}
        onCancelDownload={cancelDownload}
        onDismiss={dismissModal}
        onSnooze={snoozeUpdate}
        onOpenSettings={openSettings}
        onOpenBrowserFallback={openBrowserFallback}
        onRetryInstall={startUpdate}
      />
    </UpdateContext.Provider>
  );
};

export const useAppUpdate = (): UpdateContextType => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within an UpdateProvider');
  }
  return context;
};
