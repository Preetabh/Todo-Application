import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, ThemeColors, DarkColors, LightColors } from '../constants/theme';
import { storage } from '../services/storage';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark'); // default to sleek dark mode

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await storage.getTheme();
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      }
    };

    loadThemePreference();
  }, []);

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const colors = isDark ? DarkColors : LightColors;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await storage.setTheme(mode);
  };

  const toggleTheme = async () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
