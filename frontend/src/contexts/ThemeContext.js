import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    // Get theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('idea_hub_theme');
    return savedTheme || 'light';
  });

  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('idea_hub_language');
    return savedLanguage || 'en';
  });

  // Create theme based on mode
  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: themeMode === 'dark' ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: themeMode === 'dark' ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: themeMode === 'dark' ? '#121212' : '#fafafa',
        paper: themeMode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: language === 'hi' ? '"Noto Sans Devanagari", "Roboto", "Helvetica", "Arial", sans-serif' : '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: themeMode === 'dark' ? '#6b6b6b #2b2b2b' : '#c1c1c1 #f1f1f1',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: themeMode === 'dark' ? '#2b2b2b' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              backgroundColor: themeMode === 'dark' ? '#6b6b6b' : '#c1c1c1',
              minHeight: 24,
              border: themeMode === 'dark' ? '3px solid #2b2b2b' : '3px solid #f1f1f1',
            },
            '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
              backgroundColor: themeMode === 'dark' ? '#959595' : '#a8a8a8',
            },
            '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
              backgroundColor: themeMode === 'dark' ? '#959595' : '#a8a8a8',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: themeMode === 'dark' ? '#959595' : '#a8a8a8',
            },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              backgroundColor: themeMode === 'dark' ? '#2b2b2b' : '#f1f1f1',
            },
          },
        },
      },
    },
  });

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('idea_hub_theme', themeMode);
  }, [themeMode]);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('idea_hub_language', language);
  }, [language]);

  const toggleTheme = () => {
    setThemeMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const changeTheme = (newTheme) => {
    setThemeMode(newTheme);
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const value = {
    themeMode,
    language,
    theme,
    toggleTheme,
    changeTheme,
    changeLanguage,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
