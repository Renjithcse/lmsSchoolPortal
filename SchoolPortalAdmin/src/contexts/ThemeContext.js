import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, getThemeColors } from '../assets/colors';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Get theme from localStorage or default to 'green'
    const savedTheme = localStorage.getItem('selectedTheme');
    return savedTheme && THEMES[savedTheme] ? savedTheme : 'green';
  });

  const [themeColors, setThemeColors] = useState(() => getThemeColors(currentTheme));

  // Update theme colors when current theme changes
  useEffect(() => {
    setThemeColors(getThemeColors(currentTheme));
    localStorage.setItem('selectedTheme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const isDarkTheme = determineIfDarkTheme(themeColors, currentTheme);
    if (typeof document !== 'undefined') {
      document.body.dataset.theme = isDarkTheme ? 'dark' : 'light';
    }
  }, [themeColors, currentTheme]);

  // Function to change theme
  const changeTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  // Function to get available themes
  const getAvailableThemes = () => {
    return Object.keys(THEMES).map(themeName => ({
      name: themeName,
      label: themeName.charAt(0).toUpperCase() + themeName.slice(1),
      colors: THEMES[themeName]
    }));
  };

  const value = {
    currentTheme,
    themeColors,
    changeTheme,
    getAvailableThemes,
    themes: THEMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

const determineIfDarkTheme = (themeColors, currentTheme) => {
  if (currentTheme === 'dark') {
    return true;
  }

  const primaryHex = themeColors?.background?.primary || '#ffffff';
  const luminance = calculateRelativeLuminance(primaryHex);
  return luminance < 0.35; // treat low luminance backgrounds as dark
};

const calculateRelativeLuminance = (hex) => {
  const normalizedHex = hex.replace('#', '');
  if (normalizedHex.length !== 6) {
    return 1;
  }

  const r = parseInt(normalizedHex.slice(0, 2), 16) / 255;
  const g = parseInt(normalizedHex.slice(2, 4), 16) / 255;
  const b = parseInt(normalizedHex.slice(4, 6), 16) / 255;

  const linearize = (channel) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

  const rLin = linearize(r);
  const gLin = linearize(g);
  const bLin = linearize(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
};
