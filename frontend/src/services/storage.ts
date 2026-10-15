import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Platform-safe SecureStore wrapper
 */
export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TOKEN_KEY, token);
        }
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.warn('Storage setToken error:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.warn('Storage getToken error:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(TOKEN_KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.warn('Storage removeToken error:', error);
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      const json = JSON.stringify(user);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_KEY, json);
        }
      } else {
        await SecureStore.setItemAsync(USER_KEY, json);
      }
    } catch (error) {
      console.warn('Storage setUser error:', error);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = window.localStorage.getItem(USER_KEY);
        }
      } else {
        raw = await SecureStore.getItemAsync(USER_KEY);
      }
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Storage getUser error:', error);
      return null;
    }
  },

  async removeUser(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(USER_KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (error) {
      console.warn('Storage removeUser error:', error);
    }
  },

  async getTheme(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem('app_theme');
        }
        return null;
      }
      return await SecureStore.getItemAsync('app_theme');
    } catch (error) {
      console.warn('Storage getTheme error:', error);
      return null;
    }
  },

  async setTheme(theme: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('app_theme', theme);
        }
      } else {
        await SecureStore.setItemAsync('app_theme', theme);
      }
    } catch (error) {
      console.warn('Storage setTheme error:', error);
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },

  async setPushToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('expo_push_token', token);
        }
      } else {
        await SecureStore.setItemAsync('expo_push_token', token);
      }
    } catch (error) {
      console.warn('Storage setPushToken error:', error);
    }
  },

  async getPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem('expo_push_token');
        }
        return null;
      }
      return await SecureStore.getItemAsync('expo_push_token');
    } catch (error) {
      console.warn('Storage getPushToken error:', error);
      return null;
    }
  },

  async clearPushToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('expo_push_token');
        }
      } else {
        await SecureStore.deleteItemAsync('expo_push_token');
      }
    } catch (error) {
      console.warn('Storage clearPushToken error:', error);
    }
  },
};

