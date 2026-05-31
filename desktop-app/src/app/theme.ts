import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  colorSchemes: {
    dark: true,
    light: true
  },
  typography: {
    fontFamily: "'Space Grotesk', 'Sora', sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: 0.4
    }
  },
  shape: {
    borderRadius: 14
  }
});
