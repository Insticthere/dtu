/**
 * context/ThemeContext.jsx — Dark / light mode management
 *
 * Strategy: class-based dark mode (Tailwind's `darkMode: 'class'`).
 * The 'dark' class is toggled on <html>. Preference is stored in localStorage
 * under 'mc_theme'. An anti-FOUC script in index.html applies the class before
 * first React paint, so there's never a flash of the wrong theme.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  // Read initial theme from the class already on <html> (set by the anti-FOUC script)
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  // Keep <html> class and localStorage in sync whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('mc_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
