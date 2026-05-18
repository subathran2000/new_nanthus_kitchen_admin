// Design tokens shared across light and dark themes

// Brand Colors (immutable)
export const brand = {
  orange: "#F7921E",
  orangeLight: "#FFB74D",
  orangeDark: "#F57C00",
  blue: "#1A75BB",
  blueLight: "#60A5FA",
  blueDark: "#2563EB",
} as const;

// Semantic Colors (same in both themes)
export const semantic = {
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

// Stat Colors — used for stat cards, progress bars, chart accents
export const statColors = {
  orange: "#F7921E",
  blue: "#3B82F6",
  green: "#10B981",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  red: "#EF4444",
} as const;

// Radius Scale
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

// Spacing constants (MUI spacing units — 1 = 8px)
export const spacing = {
  pageGutter: 3, // 24px
  sectionGap: 3, // 24px
  headerGap: 4, // 32px
  cardPadding: 2, // 16px
} as const;

// Typography
export const fonts = {
  heading: '"Poppins", sans-serif',
  body: '"Inter", "Poppins", sans-serif',
} as const;
