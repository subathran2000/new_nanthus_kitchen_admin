import { createTheme, alpha } from "@mui/material/styles";

// Nanthus Kitchen Brand Colors
const brandOrange = "#F7921E";
const brandBlue = "#1A75BB";

// Premium Dark Palette - Deep Void
const backgroundDefault = "#020617"; // Slate 950 (Deepest Blue/Black)
const backgroundPaper = "#0F172A"; // Slate 900 ( rich dark surface)
const textPrimary = "#F8FAFC"; // Slate 50
const textSecondary = "#94A3B8"; // Slate 400

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: brandOrange,
      light: "#FFB74D",
      dark: "#F57C00",
      contrastText: "#000000",
    },
    secondary: {
      main: brandBlue,
      light: "#60A5FA",
      dark: "#2563EB",
      contrastText: "#FFFFFF",
    },
    background: {
      default: backgroundDefault,
      paper: backgroundPaper,
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
    },
    divider: alpha("#FFFFFF", 0.06),
    action: {
      hover: alpha(brandBlue, 0.08),
      selected: alpha(brandOrange, 0.12),
    },
    success: { main: "#10B981" },
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    info: { main: "#3B82F6" },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", sans-serif',
    h1: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
      color: textPrimary,
    },
    h2: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      color: textPrimary,
    },
    h3: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      color: textPrimary,
    },
    h4: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: textPrimary,
    },
    h5: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      color: textPrimary,
    },
    h6: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      color: textPrimary,
    },
    subtitle1: { color: textSecondary, fontWeight: 500 },
    subtitle2: {
      color: textSecondary,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontSize: "0.75rem",
    },
    body1: { color: textPrimary, lineHeight: 1.6 },
    body2: { color: textSecondary, lineHeight: 1.6 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.02em" },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `radial-gradient(circle at 50% -20%, ${alpha(brandBlue, 0.15)}, transparent 40%), radial-gradient(circle at 100% 0%, ${alpha(brandOrange, 0.1)}, transparent 30%)`,
          backgroundAttachment: "fixed",
          scrollbarColor: "#334155 #020617",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#334155",
            "&:hover": { backgroundColor: "#475569" },
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
          backgroundColor: alpha(backgroundPaper, 0.6), // Glass effect base
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(247, 146, 30, 0.1)`, // Subtle orange glow
            borderColor: alpha(brandOrange, 0.3),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: alpha(backgroundPaper, 0.8),
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        },
        elevation1: { boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          transition: "all 0.2s",
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brandOrange} 0%, #EA580C 100%)`, // Vibrant Orange Gradient
          boxShadow: `0 4px 12px ${alpha(brandOrange, 0.4)}`,
          color: "#fff",
          "&:hover": {
            background: `linear-gradient(135deg, #F57C00 0%, #D84315 100%)`,
            boxShadow: `0 6px 16px ${alpha(brandOrange, 0.6)}`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${brandBlue} 0%, #1E40AF 100%)`, // Vibrant Blue Gradient
          boxShadow: `0 4px 12px ${alpha(brandBlue, 0.4)}`,
          "&:hover": {
            background: `linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)`,
            boxShadow: `0 6px 16px ${alpha(brandBlue, 0.6)}`,
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
            backgroundColor: alpha(brandOrange, 0.05),
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: alpha("#020617", 0.95), // Nearly opaque for readability
          backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha("#020617", 0.7),
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "4px 12px",
          padding: "10px 16px",
          transition: "all 0.2s",
          "&.Mui-selected": {
            background: `linear-gradient(90deg, ${alpha(brandOrange, 0.15)} 0%, transparent 100%)`,
            borderLeft: `4px solid ${brandOrange}`,
            color: brandOrange,
            "& .MuiListItemIcon-root": { color: brandOrange },
            "&:hover": {
              background: `linear-gradient(90deg, ${alpha(brandOrange, 0.25)} 0%, transparent 100%)`,
            },
          },
          "&:not(.Mui-selected):hover": {
            backgroundColor: alpha(textSecondary, 0.1),
            color: textPrimary,
            "& .MuiListItemIcon-root": { color: textPrimary },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: textSecondary,
          minWidth: 40,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: alpha("#fff", 0.03),
            transition: "all 0.2s",
            "& fieldset": {
              borderColor: alpha("#fff", 0.1),
              transition: "all 0.2s",
            },
            "&:hover": { backgroundColor: alpha("#fff", 0.05) },
            "&:hover fieldset": { borderColor: alpha("#fff", 0.3) },
            "&.Mui-focused fieldset": {
              borderColor: brandOrange,
              borderWidth: 2,
              boxShadow: `0 0 12px ${alpha(brandOrange, 0.3)}`,
            },
            // Override autofill styles
            "& input:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 100px transparent inset !important",
              WebkitTextFillColor: "#fff !important",
              caretColor: "#fff",
              transition: "background-color 5000s ease-in-out 0s",
            },
            "& input:-webkit-autofill:hover": {
              WebkitBoxShadow: "0 0 0 100px transparent inset !important",
              WebkitTextFillColor: "#fff !important",
            },
            "& input:-webkit-autofill:focus": {
              WebkitBoxShadow: "0 0 0 100px transparent inset !important",
              WebkitTextFillColor: "#fff !important",
            },
            "& input:-webkit-autofill:active": {
              WebkitBoxShadow: "0 0 0 100px transparent inset !important",
              WebkitTextFillColor: "#fff !important",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          background: "#0F172A", // Solid darker bg for dialogs
          border: `1px solid ${alpha("#fff", 0.1)}`,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          border: "1px solid transparent",
        },
        outlined: { borderColor: alpha("#fff", 0.2) },
      },
    },
  },
});
