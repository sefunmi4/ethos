
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const getSystemTheme = (): 'light' | 'dark' =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

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
      if (mql.addEventListener) {
        mql.addEventListener('change', handler);
      } else {
        // @ts-expect-error addListener is deprecated but required for older browsers/tests
        mql.addListener(handler);
      }
      return () => {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', handler);
        } else {
          // @ts-expect-error removeListener is deprecated but required for older browsers/tests
          mql.removeListener(handler);
        }
      };
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

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
