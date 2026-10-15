import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { api } from './api';
import { storage } from './storage';

const EAS_PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId || '6c38a271-6e8a-464b-9bf5-645c16848922';

// Configure foreground notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

let responseListenerSubscription: Notifications.Subscription | null = null;
let tokenRefreshSubscription: Notifications.Subscription | null = null;

/**
 * Configure Android notification channels
 */
export async function configureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      description: 'Default notification channel for DIGENT TECH push alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0284C7',
      sound: 'default',
      showBadge: true,
    });
  }
}

/**
 * Register device for push notifications and sync token with backend
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await configureAndroidNotificationChannel();

  // Push notifications require physical hardware device on Android / iOS
  if (!Device.isDevice) {
    console.warn('[Push Notification] Push tokens are only generated on physical hardware devices.');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push Notification] Permission for push notifications was not granted.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });

    const expoPushToken = tokenData.data;
    console.log('[Push Notification] Acquired Expo push token:', expoPushToken);

    // Save token locally
    await storage.setPushToken(expoPushToken);

    // Register with backend
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'other';
    const deviceName = `${Device.manufacturer || ''} ${Device.modelName || 'Device'}`.trim();
    const appVersion = Constants?.expoConfig?.version || '1.1.1';

    const res = await api.push.register({
      expoPushToken,
      platform,
      deviceId: Device.osBuildId || Device.osInternalBuildId || null,
      deviceName,
      appVersion,
      permissionStatus: finalStatus,
    });

    if (res.success) {
      console.log('[Push Notification] Successfully registered token with backend');
    } else {
      console.warn('[Push Notification] Failed registering token with backend:', res.message);
    }

    return expoPushToken;
  } catch (error: any) {
    console.error('[Push Notification Error] Failed to generate/register push token:', error.message);
    return null;
  }
}

/**
 * Handle notification tap navigation / deep linking
 */
export function handleNotificationNavigation(data: Record<string, any> | undefined): void {
  if (!data) return;

  const target = data.deepLink || data.screen || data.route;

  if (target) {
    try {
      if (typeof target === 'string') {
        const cleanPath = target.replace(/^myfirstapp:\/\//, '/').replace(/^\/?/, '/');
        if (cleanPath.startsWith('/todo')) {
          router.push('/todo');
        } else if (cleanPath.startsWith('/passwords')) {
          router.push('/passwords');
        } else if (cleanPath.startsWith('/documents')) {
          router.push('/documents');
        } else if (cleanPath.startsWith('/profile')) {
          router.push('/profile');
        } else if (cleanPath.startsWith('/home')) {
          router.push('/home');
        }
      }
    } catch (navError) {
      console.warn('[Push Notification] Failed navigating to target route:', navError);
    }
  }
}

/**
 * Setup notification listeners for incoming pushes and deep link clicks
 */
export function setupPushNotificationListeners(): () => void {
  // Check if app was launched from a notification tap when closed
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    }
  });

  // Handle interaction with notification (app in background or foreground)
  responseListenerSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    handleNotificationNavigation(data);
  });

  // Listen for Expo push token refresh events
  tokenRefreshSubscription = Notifications.addPushTokenListener((tokenData) => {
    if (tokenData?.data) {
      registerForPushNotificationsAsync();
    }
  });

  return () => {
    if (responseListenerSubscription) {
      responseListenerSubscription.remove();
      responseListenerSubscription = null;
    }
    if (tokenRefreshSubscription) {
      tokenRefreshSubscription.remove();
      tokenRefreshSubscription = null;
    }
  };
}

/**
 * Unregister device token from backend on logout
 */
export async function unregisterPushTokenAsync(): Promise<void> {
  try {
    const token = await storage.getPushToken();
    if (token) {
      await api.push.unregister(token);
      await storage.clearPushToken();
    }
  } catch (error: any) {
    console.warn('[Push Notification] Error unregistering push token:', error.message);
  }
}
