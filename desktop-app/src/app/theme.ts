import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  colorSchemes: {
    dark: true,
    light: true
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#7ff0d2'
    },
    secondary: {
      main: '#ff8e42'
    },
    background: {
      default: '#060814',
      paper: 'rgba(10, 15, 29, 0.84)'
    },
    text: {
      primary: '#eff3ff',
      secondary: 'rgba(226, 232, 255, 0.72)'
    }
  },
  typography: {
    fontFamily: "'Space Grotesk', 'Sora', sans-serif",
    h2: {
      fontWeight: 700,
      letterSpacing: -1.8,
      lineHeight: 0.95
    },
    h4: {
      fontWeight: 700,
      letterSpacing: -0.6,
      lineHeight: 1.05
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
          background: 'linear-gradient(135deg, #7ff0d2, #54aefc)',
          color: '#06111b'
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #ff8e42, #ff5d82)'
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
          boxShadow: '0 0 0 4px rgba(127, 240, 210, 0.18)'
        },
        track: {
          border: 'none',
          background: 'linear-gradient(90deg, #7ff0d2, #54aefc)'
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
            backgroundColor: '#7ff0d2'
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
