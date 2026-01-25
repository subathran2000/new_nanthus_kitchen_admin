import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ScrollToTop } from "./components/ScrollToTop";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

// Dashboard Pages
import { DashboardPage } from "./pages/dashboard/DashboardPage";

// Menu Pages
import { PrimaryCategoriesPage } from "./pages/menu/PrimaryCategoriesPage";
import { MenuCategoriesPage } from "./pages/menu/MenuCategoriesPage";
import { MenuItemsPage } from "./pages/menu/MenuItemsPage";
import { MeasurementTypesPage } from "./pages/menu/MeasurementTypesPage";

// Other Pages
import { EventsPage } from "./pages/events/EventsPage";
import { SpecialsPage } from "./pages/specials/SpecialsPage";
import { OpeningHoursPage } from "./pages/opening-hours/OpeningHoursPage";
import { NewsletterSubscribersPage } from "./pages/newsletter/NewsletterSubscribersPage";
import { NewsletterCampaignsPage } from "./pages/newsletter/NewsletterCampaignsPage";
import { UsersPage } from "./pages/users/UsersPage";
import { SettingsPage } from "./pages/settings/SettingsPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Menu Management - All authenticated users can view */}
                <Route path="menu">
                  <Route
                    path="primary-categories"
                    element={<PrimaryCategoriesPage />}
                  />
                  <Route path="categories" element={<MenuCategoriesPage />} />
                  <Route path="items" element={<MenuItemsPage />} />
                  <Route
                    path="measurement-types"
                    element={<MeasurementTypesPage />}
                  />
                </Route>

                {/* Other Management - All authenticated users can view */}
                <Route path="events" element={<EventsPage />} />
                <Route path="specials" element={<SpecialsPage />} />
                <Route path="opening-hours" element={<OpeningHoursPage />} />

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

                {/* Users - Super Admin and Admin only */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch all - redirect to login for unauthenticated users */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
