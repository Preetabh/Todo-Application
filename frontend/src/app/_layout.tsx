import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { UpdateProvider } from '../context/UpdateContext';
import { setupPushNotificationListeners } from '../services/pushNotification';

// Keep splash screen visible until initial bootstrap completes
SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigation() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="home" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="todo" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="passwords" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="documents" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 400);

    // Setup push notification listeners (foreground alerts, deep links)
    const cleanupPushListeners = setupPushNotificationListeners();

    return () => {
      clearTimeout(timer);
      if (typeof cleanupPushListeners === 'function') {
        cleanupPushListeners();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <UpdateProvider>
            <AppNavigation />
          </UpdateProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
