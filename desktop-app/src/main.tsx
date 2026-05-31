import React from 'react';
import { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, useMediaQuery } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { App } from './app/App';
import { createAppTheme } from './app/theme';
import { useAppStore } from './stores/appStore';
import './styles.css';

const AppRoot = () => {
  const themeMode = useAppStore((state) => state.settings.themeMode);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedThemeMode = themeMode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : themeMode;
  const theme = useMemo(() => createAppTheme(resolvedThemeMode), [resolvedThemeMode]);

  useEffect(() => {
    document.body.dataset.theme = resolvedThemeMode;
  }, [resolvedThemeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
