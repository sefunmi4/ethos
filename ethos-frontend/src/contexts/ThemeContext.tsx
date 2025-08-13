
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemTheme } from './ThemeHelpers';
import type { Theme } from './ThemeHelpers';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored as Theme;
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = (t: 'light' | 'dark') => {
      document.documentElement.classList.toggle('dark', t === 'dark');
      document.body.classList.toggle('dark', t === 'dark');
    };

    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      apply(getSystemTheme());
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
      }
      if (typeof mql.addListener === 'function') {
        mql.addListener(handler);
        return () => mql.removeListener(handler);
      }
      return;
    }

    apply(theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'));
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
