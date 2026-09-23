import { createTheme } from "@mui/material/styles";
import { ruRU as coreRuRU } from "@mui/material/locale";
import { ruRU as dataGridRuRU } from "@mui/x-data-grid/locales";

export const theme = createTheme(
  {
    palette: {
      mode: "light",
      primary: { main: "#0f6073", dark: "#0a4554", light: "#4b8796" },
      secondary: { main: "#d97706" },
      background: { default: "#f3f6f8", paper: "#ffffff" },
      text: { primary: "#17242b", secondary: "#5d6b73" },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
      h4: { fontWeight: 750, letterSpacing: "-0.025em" },
      h5: { fontWeight: 700, letterSpacing: "-0.015em" },
      h6: { fontWeight: 700 },
      button: { fontWeight: 650, textTransform: "none" },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTextField: { defaultProps: { size: "small" } },
      MuiFormControl: { defaultProps: { size: "small" } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    },
  },
  coreRuRU,
  dataGridRuRU,
);
