import { lazy, Suspense, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import {
  ThemeProvider,
  CssBaseline,
  CircularProgress,
  Box,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useThemeMode } from "./hooks/useThemeMode";
import { AuthProvider } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ScrollToTop } from "./components/ScrollToTop";

// Theme mode context so any component can read/toggle the mode
interface ThemeModeContextValue {
  mode: "light" | "dark";
  toggleMode: () => void;
}
const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "dark",
  toggleMode: () => {},
});
export const useThemeModeContext = () => useContext(ThemeModeContext);

// Auth Pages - loaded immediately (entry points)
import { LoginPage } from "./pages/auth/LoginPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

// Lazy loaded pages for better performance
const DashboardPage = lazy(() =>
  import("./pages/dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const PrimaryCategoriesPage = lazy(() =>
  import("./pages/menu/PrimaryCategoriesPage").then((m) => ({
    default: m.PrimaryCategoriesPage,
  })),
);
const MenuCategoriesPage = lazy(() =>
  import("./pages/menu/MenuCategoriesPage").then((m) => ({
    default: m.MenuCategoriesPage,
  })),
);
const MenuItemsPage = lazy(() =>
  import("./pages/menu/MenuItemsPage").then((m) => ({
    default: m.MenuItemsPage,
  })),
);
const MeasurementTypesPage = lazy(() =>
  import("./pages/menu/MeasurementTypesPage").then((m) => ({
    default: m.MeasurementTypesPage,
  })),
);
const EventsPage = lazy(() =>
  import("./pages/events/EventsPage").then((m) => ({ default: m.EventsPage })),
);
const SpecialsPage = lazy(() =>
  import("./pages/specials/SpecialsPage").then((m) => ({
    default: m.SpecialsPage,
  })),
);
const OpeningHoursPage = lazy(() =>
  import("./pages/opening-hours/OpeningHoursPage").then((m) => ({
    default: m.OpeningHoursPage,
  })),
);
const NewsletterSubscribersPage = lazy(() =>
  import("./pages/newsletter/NewsletterSubscribersPage").then((m) => ({
    default: m.NewsletterSubscribersPage,
  })),
);
const NewsletterCampaignsPage = lazy(() =>
  import("./pages/newsletter/NewsletterCampaignsPage").then((m) => ({
    default: m.NewsletterCampaignsPage,
  })),
);
const UsersPage = lazy(() =>
  import("./pages/users/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const GalleryPage = lazy(() =>
  import("./pages/gallery/GalleryPage").then((m) => ({
    default: m.GalleryPage,
  })),
);

// Loading fallback component
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px",
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  const { mode, theme, toggleMode } = useThemeMode();

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <LocationProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      index
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<DashboardPage />} />

                    {/* Menu Management - All authenticated users can view */}
                    <Route path="menu">
                      <Route
                        path="primary-categories"
                        element={<PrimaryCategoriesPage />}
                      />
                      <Route
                        path="categories"
                        element={<MenuCategoriesPage />}
                      />
                      <Route path="items" element={<MenuItemsPage />} />
                      <Route
                        path="measurement-types"
                        element={<MeasurementTypesPage />}
                      />
                    </Route>

                    {/* Other Management - All authenticated users can view */}
                    <Route path="events" element={<EventsPage />} />
                    <Route path="specials" element={<SpecialsPage />} />
                    <Route
                      path="opening-hours"
                      element={<OpeningHoursPage />}
                    />
                    <Route path="gallery" element={<GalleryPage />} />

                    {/* Newsletter - All authenticated users can view */}
                    <Route path="newsletter">
                      <Route
                        path="subscribers"
                        element={<NewsletterSubscribersPage />}
                      />
                      <Route
                        path="campaigns"
                        element={<NewsletterCampaignsPage />}
                      />
                    </Route>

                    {/* Users - Super Admin, Admin, and Manager only */}
                    <Route
                      path="users"
                      element={
                        <ProtectedRoute
                          allowedRoles={["super_admin", "admin", "manager"]}
                        >
                          <UsersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route
                      path="*"
                      element={
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "60vh",
                            gap: 2,
                          }}
                        >
                          <Box
                            component="h1"
                            sx={{ fontSize: "4rem", fontWeight: 700, m: 0 }}
                          >
                            404
                          </Box>
                          <Box sx={{ color: "text.secondary", mb: 2 }}>
                            Page not found
                          </Box>
                        </Box>
                      }
                    />
                  </Route>

                  {/* Catch all - redirect to login for unauthenticated users */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
              </LocationProvider>
            </AuthProvider>
          </BrowserRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export default App;
