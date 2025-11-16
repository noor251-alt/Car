import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('auto');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Détection automatique selon l'heure
    const detectAutoTheme = () => {
      const hour = new Date().getHours();
      // Mode sombre de 18h à 7h
      return (hour >= 18 || hour < 7) ? 'dark' : 'light';
    };

    // Détection du thème système
    const detectSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const updateTheme = () => {
      let newTheme: 'light' | 'dark';
      
      if (theme === 'auto') {
        newTheme = detectAutoTheme();
      } else {
        newTheme = theme;
      }
      
      setCurrentTheme(newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      
      // Mise à jour des couleurs CSS custom
      if (newTheme === 'dark') {
        document.documentElement.style.setProperty('--bg-primary', '#0f1419');
        document.documentElement.style.setProperty('--bg-secondary', '#1a202c');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#a0aec0');
        document.documentElement.style.setProperty('--bubble-opacity', '0.8');
      } else {
        document.documentElement.style.setProperty('--bg-primary', '#f7fafc');
        document.documentElement.style.setProperty('--bg-secondary', '#edf2f7');
        document.documentElement.style.setProperty('--text-primary', '#2d3748');
        document.documentElement.style.setProperty('--text-secondary', '#4a5568');
        document.documentElement.style.setProperty('--bubble-opacity', '0.6');
      }
    };

    updateTheme();

    // Mise à jour automatique toutes les minutes si mode auto
    let interval: NodeJS.Timeout;
    if (theme === 'auto') {
      interval = setInterval(updateTheme, 60000);
    }

    // Écouter les changements de thème système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      if (interval) clearInterval(interval);
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};