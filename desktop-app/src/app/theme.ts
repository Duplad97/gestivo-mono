import { createTheme } from '@mui/material/styles';

type ResolvedThemeMode = 'light' | 'dark';

export const createAppTheme = (mode: ResolvedThemeMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#7ff0d2'
    },
    secondary: {
      main: '#9b7cff'
    },
    background: mode === 'dark'
      ? {
          default: '#060814',
          paper: 'rgba(10, 15, 29, 0.84)'
        }
      : {
          default: '#f4f7fb',
          paper: 'rgba(255, 255, 255, 0.88)'
        },
    text: mode === 'dark'
      ? {
          primary: '#eff3ff',
          secondary: 'rgba(226, 232, 255, 0.72)'
        }
      : {
          primary: '#102033',
          secondary: 'rgba(16, 32, 51, 0.68)'
        }
  },
  typography: {
    fontFamily: "'Revalia', 'Space Grotesk', 'Sora', sans-serif",
    h3: {
      fontFamily: "'Revalia', 'Space Grotesk', 'Sora', sans-serif",
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.08
    },
    h2: {
      fontWeight: 700,
      letterSpacing: -1.8,
      lineHeight: 0.95
    },
    h4: {
      fontFamily: "'Revalia', 'Space Grotesk', 'Sora', sans-serif",
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.08
    },
    h5: {
      fontFamily: "'Revalia', 'Space Grotesk', 'Sora', sans-serif",
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.08
    },
    h6: {
      fontWeight: 700,
      letterSpacing: 0.2
    },
    button: {
      fontWeight: 700,
      letterSpacing: 0.25,
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 20
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          paddingInline: 18,
          minHeight: 46,
          boxShadow: 'none'
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7ff0d2, #54aefc 56%, #8d6dff)',
          color: '#06111b'
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #8d6dff, #c45bff 58%, #ff6aa2)'
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.03)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.08)'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)'
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 6
        },
        thumb: {
          width: 16,
          height: 16,
          boxShadow: '0 0 0 4px rgba(141, 109, 255, 0.2)'
        },
        track: {
          border: 'none',
          background: 'linear-gradient(90deg, #7ff0d2, #54aefc 52%, #8d6dff)'
        },
        rail: {
          opacity: 1,
          background: 'rgba(255,255,255,0.16)'
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#06111b'
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#8d6dff'
          }
        },
        track: {
          backgroundColor: 'rgba(255,255,255,0.18)',
          opacity: 1
        }
      }
    }
  }
});
