import { createTheme, alpha, type ThemeOptions } from "@mui/material/styles";
import { brand, semantic, radius, fonts } from "./tokens";

// ─── Shared Options (mode-independent) ───────────────────────────

const sharedTypography: ThemeOptions["typography"] = {
  fontFamily: fonts.body,
  h1: { fontFamily: fonts.heading, fontWeight: 700 },
  h2: { fontFamily: fonts.heading, fontWeight: 600 },
  h3: { fontFamily: fonts.heading, fontWeight: 600 },
  h4: { fontFamily: fonts.heading, fontWeight: 600, letterSpacing: "-0.02em" },
  h5: { fontFamily: fonts.heading, fontWeight: 600 },
  h6: { fontFamily: fonts.heading, fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  subtitle2: {
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: "0.75rem",
  },
  body1: { lineHeight: 1.6 },
  body2: { lineHeight: 1.6 },
  button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.02em" },
};

const sharedComponents = (
  mode: "light" | "dark",
): ThemeOptions["components"] & Record<string, unknown> => {
  const isDark = mode === "dark";

  // Surface and overlay colours per mode
  const bgDefault = isDark ? "#0C1220" : "#F8FAFC";
  const bgPaper = isDark ? "#141C2E" : "#FFFFFF";
  const borderAlpha = isDark ? 0.08 : 0.1;
  const inputBgHover = isDark ? alpha("#fff", 0.05) : alpha("#000", 0.02);
  const inputBgBase = isDark ? alpha("#fff", 0.03) : alpha("#000", 0.01);
  const autofillColor = isDark ? "#fff" : "#0F172A";
  const scrollThumb = isDark ? "#334155" : "#CBD5E1";
  const scrollThumbHover = isDark ? "#475569" : "#94A3B8";

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: bgDefault,
          scrollbarColor: `${scrollThumb} transparent`,
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: scrollThumb,
            "&:hover": { backgroundColor: scrollThumbHover },
          },
          "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
            borderRadius: 8,
            backgroundColor: "transparent",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: bgPaper,
          border: `1px solid ${alpha(isDark ? "#fff" : "#000", borderAlpha)}`,
          boxShadow: isDark
            ? "0 4px 6px -1px rgba(0,0,0,0.15), 0 2px 4px -1px rgba(0,0,0,0.08)"
            : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          transition:
            "box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out",
          "&:hover": {
            boxShadow: isDark
              ? `0 8px 16px rgba(0,0,0,0.25), 0 2px 4px ${alpha(brand.orange, 0.08)}`
              : "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
            borderColor: alpha(brand.orange, isDark ? 0.25 : 0.2),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: bgPaper,
          border: `1px solid ${alpha(isDark ? "#fff" : "#000", borderAlpha)}`,
        },
        elevation1: {
          boxShadow: isDark
            ? "0px 4px 20px rgba(0,0,0,0.2)"
            : "0px 1px 4px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          padding: "10px 24px",
          transition: "all 0.2s",
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brand.orange} 0%, #EA580C 100%)`,
          boxShadow: `0 4px 12px ${alpha(brand.orange, 0.4)}`,
          color: "#fff",
          "&:hover": {
            background: `linear-gradient(135deg, ${brand.orangeDark} 0%, #D84315 100%)`,
            boxShadow: `0 6px 16px ${alpha(brand.orange, 0.6)}`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${brand.blue} 0%, #1E40AF 100%)`,
          boxShadow: `0 4px 12px ${alpha(brand.blue, 0.4)}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${brand.blueDark} 0%, #1D4ED8 100%)`,
            boxShadow: `0 6px 16px ${alpha(brand.blue, 0.6)}`,
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
            backgroundColor: alpha(brand.orange, 0.05),
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? alpha("#0C1220", 0.97) : "#FFFFFF",
          borderRight: `1px solid ${alpha(isDark ? "#fff" : "#000", borderAlpha)}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? alpha("#0C1220", 0.85)
            : alpha("#FFFFFF", 0.9),
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${alpha(isDark ? "#fff" : "#000", borderAlpha)}`,
          boxShadow: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          margin: "4px 12px",
          padding: "10px 16px",
          transition: "all 0.2s",
          "&.Mui-selected": {
            background: `linear-gradient(90deg, ${alpha(brand.orange, 0.15)} 0%, transparent 100%)`,
            borderLeft: `4px solid ${brand.orange}`,
            color: brand.orange,
            "& .MuiListItemIcon-root": { color: brand.orange },
            "&:hover": {
              background: `linear-gradient(90deg, ${alpha(brand.orange, 0.25)} 0%, transparent 100%)`,
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 40 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: radius.md,
            backgroundColor: inputBgBase,
            transition: "all 0.2s",
            "& fieldset": {
              borderColor: alpha(isDark ? "#fff" : "#000", 0.15),
              transition: "all 0.2s",
            },
            "&:hover": { backgroundColor: inputBgHover },
            "&:hover fieldset": {
              borderColor: alpha(isDark ? "#fff" : "#000", 0.3),
            },
            "&.Mui-focused fieldset": {
              borderColor: brand.orange,
              borderWidth: 2,
              boxShadow: `0 0 8px ${alpha(brand.orange, 0.25)}`,
            },
            "& input:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 100px transparent inset !important",
              WebkitTextFillColor: `${autofillColor} !important`,
              caretColor: autofillColor,
              transition: "background-color 5000s ease-in-out 0s",
            },
            "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
              {
                WebkitBoxShadow: "0 0 0 100px transparent inset !important",
                WebkitTextFillColor: `${autofillColor} !important`,
              },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.xl,
          backgroundColor: bgPaper,
          border: `1px solid ${alpha(isDark ? "#fff" : "#000", 0.1)}`,
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0,0,0,0.5)"
            : "0 25px 50px -12px rgba(0,0,0,0.15)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          fontWeight: 600,
          border: "1px solid transparent",
        },
        outlined: {
          borderColor: alpha(isDark ? "#fff" : "#000", 0.2),
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: isDark ? "#1A2540" : "#F1F5F9",
            borderBottom: `1px solid ${alpha(isDark ? "#fff" : "#000", borderAlpha)}`,
          },
          "& .MuiDataGrid-cell": {
            borderBottom: `1px solid ${alpha(isDark ? "#fff" : "#000", 0.04)}`,
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: alpha(brand.orange, isDark ? 0.04 : 0.03),
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: brand.orange,
          height: 3,
          borderRadius: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          "&.Mui-selected": { color: brand.orange },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: brand.orange,
            "& + .MuiSwitch-track": {
              backgroundColor: alpha(brand.orange, 0.5),
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isDark ? "#1E293B" : "#334155",
          color: "#F8FAFC",
          fontSize: "0.75rem",
          borderRadius: radius.sm,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(isDark ? "#fff" : "#000", 0.08),
        },
      },
    },
  };
};

// ─── Dark Theme ──────────────────────────────────────────────────

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: brand.orange,
      light: brand.orangeLight,
      dark: brand.orangeDark,
      contrastText: "#000000",
    },
    secondary: {
      main: brand.blue,
      light: brand.blueLight,
      dark: brand.blueDark,
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#0C1220",
      paper: "#141C2E",
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#94A3B8",
    },
    divider: alpha("#FFFFFF", 0.08),
    action: {
      hover: alpha(brand.blue, 0.08),
      selected: alpha(brand.orange, 0.12),
    },
    success: { main: semantic.success },
    error: { main: semantic.error },
    warning: { main: semantic.warning },
    info: { main: semantic.info },
  },
  typography: sharedTypography,
  shape: { borderRadius: radius.md },
  components: sharedComponents("dark"),
});

// ─── Light Theme ─────────────────────────────────────────────────

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.orange,
      light: brand.orangeLight,
      dark: brand.orangeDark,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: brand.blue,
      light: brand.blueLight,
      dark: brand.blueDark,
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
    divider: alpha("#000000", 0.08),
    action: {
      hover: alpha(brand.blue, 0.06),
      selected: alpha(brand.orange, 0.1),
    },
    success: { main: semantic.success },
    error: { main: semantic.error },
    warning: { main: semantic.warning },
    info: { main: semantic.info },
  },
  typography: sharedTypography,
  shape: { borderRadius: radius.md },
  components: sharedComponents("light"),
});

// ─── Legacy export (backwards-compat; used in App.tsx until we migrate) ──

export const theme = darkTheme;
