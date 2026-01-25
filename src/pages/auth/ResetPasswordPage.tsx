import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useSearchParams, useNavigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  ArrowBack,
} from "@mui/icons-material";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  // Password requirements
  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    {
      label: "One special character (@$!%*?&)",
      met: /[@$!%*?&]/.test(password),
    },
  ];

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError("Invalid reset token");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.post("/auth/reset-password", {
        token,
        newPassword: data.password,
      });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
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
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
            <Box
              component="img"
              src="/new_nanthus_kitchen_logo.png"
              alt="Nanthu's Kitchen"
              sx={{
                width: "auto",
                height: 80,
                objectFit: "contain",
                mb: 3,
              }}
            />
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
              }}
            >
              Invalid or missing reset token. Please request a new password
              reset link.
            </Alert>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              sx={{
                color: "#F7921E",
                textDecoration: "none",
                fontWeight: 500,
                "&:hover": {
                  color: "#FFB74D",
                  textDecoration: "underline",
                },
              }}
            >
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
          maxWidth: 480,
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
              component="img"
              src="/new_nanthus_kitchen_logo.png"
              alt="Nanthu's Kitchen"
              sx={{
                width: "auto",
                height: { xs: 80, sm: 100 },
                objectFit: "contain",
                mb: 2,
                filter: "drop-shadow(0 4px 12px rgba(247, 146, 30, 0.2))",
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "#F8FAFC",
                mb: 0.5,
              }}
            >
              Reset Password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#94A3B8",
                letterSpacing: 0.5,
              }}
            >
              Create a new secure password for your account
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

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message:
                    "Password must contain uppercase, lowercase, number and special character",
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
                mb: 2,
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

            {/* Password Requirements */}
            {password && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94A3B8",
                    fontWeight: 500,
                    display: "block",
                    mb: 1,
                  }}
                >
                  Password Requirements:
                </Typography>
                <List dense disablePadding>
                  {passwordRequirements.map((req, index) => (
                    <ListItem key={index} disablePadding sx={{ py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {req.met ? (
                          <CheckIcon sx={{ fontSize: 16, color: "#10B981" }} />
                        ) : (
                          <CancelIcon sx={{ fontSize: 16, color: "#64748B" }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={req.label}
                        primaryTypographyProps={{
                          variant: "caption",
                          sx: { color: req.met ? "#10B981" : "#64748B" },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#64748B", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      size="small"
                      sx={{ color: "#64748B" }}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
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

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                mb: 2,
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
                "Reset Password"
              )}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{
                  color: "#F7921E",
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  transition: "color 0.2s",
                  "&:hover": {
                    color: "#FFB74D",
                    textDecoration: "underline",
                  },
                }}
              >
                <ArrowBack fontSize="small" />
                Back to Login
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
