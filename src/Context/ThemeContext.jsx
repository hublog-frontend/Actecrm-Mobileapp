import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// ─── Light & Dark Palettes ────────────────────────────────────────────────────
export const lightTheme = {
  dark: false,

  // Backgrounds
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  inputBg: '#F8FAFC',

  // Text
  textPrimary: '#1A3353',
  textSecondary: '#7D8DA1',
  textMuted: '#A0AEC0',

  // Borders
  border: '#7d8da154',
  borderLight: '#F0F3F7',

  // Brand
  primary: '#5b69ca',
  primaryLight: '#EEF0FF',

  // Status Bar
  statusBarStyle: 'dark-content',
  statusBarBg: '#FFFFFF',

  // Misc
  error: '#E53E3E',
  success: '#2E7D32',
  warning: '#E65100',
  overlay: 'rgba(26, 51, 83, 0.4)',
};

export const darkTheme = {
  dark: true,

  // Backgrounds
  background: '#000',
  surface: '#1b1e23',
  surfaceSecondary: '#1b1e23',
  inputBg: '#000',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Borders
  border: '#5e6166',
  borderLight: '#1b1e23',

  // Brand
  primary: '#7C8FE8',
  primaryLight: '#1E2A4A',

  // Status Bar
  statusBarStyle: 'light-content',
  statusBarBg: '#1b1e23',

  // Misc
  error: '#FC8181',
  success: '#68D391',
  warning: '#F6AD55',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  // Sync with system changes
  useEffect(() => {
    setIsDark(systemScheme === 'dark');
  }, [systemScheme]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useTheme = () => useContext(ThemeContext);
