import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, Navigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  Alert,
  CircularProgress,
  Divider,
  alpha,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { LoginCredentials } from "@/types";

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background:
            "linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #1A2942 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#F7921E" }} />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await login(data);
      // Navigation is handled in the login function
    } catch (err: any) {
      // Error handling is done in the login function, but we also set local error for the Alert
      let errorMessage = "Invalid credentials. Please try again.";
      
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;
        
        if (status === 401) {
          errorMessage = serverMessage || "Invalid email or password";
        } else if (status === 403) {
          errorMessage = serverMessage || "Your account has been deactivated";
        } else if (status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (serverMessage) {
          errorMessage = serverMessage;
        }
      } else if (err.request) {
        // Network error
        errorMessage = "Unable to connect to server. Please check your connection.";
      } else if (err.message && err.message !== "Login failed. Please try again.") {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #1A2942 100%)",
        p: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "60%",
          height: "100%",
          background: `radial-gradient(circle, ${alpha("#F7921E", 0.08)} 0%, transparent 70%)`,
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "50%",
          height: "80%",
          background: `radial-gradient(circle, ${alpha("#1A75BB", 0.06)} 0%, transparent 70%)`,
          pointerEvents: "none",
        },
      }}
    >
      <Card
        sx={{
          maxWidth: 460,
          width: "100%",
          backdropFilter: "blur(20px)",
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 4,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)`,
          position: "relative",
          zIndex: 1,
          overflow: "visible",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "3px",
            background:
              "linear-gradient(90deg, transparent, #F7921E, transparent)",
            borderRadius: "0 0 4px 4px",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          {/* Logo Section */}
          <Box
            sx={{
              textAlign: "center",
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                position: "relative",
              }}
            >
              <Box
                component="img"
                src="/new_nanthus_kitchen_logo.png"
                alt="Nanthu's Kitchen"
                sx={{
                  width: "auto",
                  height: { xs: 100, sm: 120 },
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(247, 146, 30, 0.2))",
                }}
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "#F8FAFC",
                mb: 0.5,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#94A3B8",
                letterSpacing: 0.5,
              }}
            >
              Sign in to access your admin dashboard
            </Typography>
          </Box>

          <Divider sx={{ mb: 3, borderColor: "rgba(255, 255, 255, 0.06)" }} />

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                "& .MuiAlert-icon": { alignItems: "center" },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "#64748B", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#64748B", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: "#64748B" }}
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                  },
                },
              }}
            />

            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{
                  color: "#F7921E",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  transition: "color 0.2s",
                  "&:hover": {
                    color: "#FFB74D",
                    textDecoration: "underline",
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "none",
                background: "linear-gradient(135deg, #F7921E 0%, #EA580C 100%)",
                boxShadow: `0 4px 14px ${alpha("#F7921E", 0.4)}`,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #FFB74D 0%, #F7921E 100%)",
                  boxShadow: `0 6px 20px ${alpha("#F7921E", 0.5)}`,
                },
                "&:disabled": {
                  background: "rgba(255, 255, 255, 0.12)",
                },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                color: "#64748B",
                fontSize: "0.75rem",
              }}
            >
              Secure admin access for authorized personnel only
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
