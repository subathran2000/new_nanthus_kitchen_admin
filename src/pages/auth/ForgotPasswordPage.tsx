import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router";
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
  Divider,
  alpha,
} from "@mui/material";
import {
  ArrowBack,
  Email as EmailIcon,
  MarkEmailRead as MailSentIcon,
} from "@mui/icons-material";
import api from "@/lib/api";

interface ForgotPasswordForm {
  email: string;
}

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post("/auth/forgot-password", data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
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
              Forgot Password?
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#94A3B8",
                letterSpacing: 0.5,
              }}
            >
              Enter your email to receive a password reset link
            </Typography>
          </Box>

          <Divider sx={{ mb: 3, borderColor: "rgba(255, 255, 255, 0.06)" }} />

          {/* Success Message */}
          {isSuccess ? (
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${alpha("#10B981", 0.2)} 0%, ${alpha("#10B981", 0.05)} 100%)`,
                  mb: 3,
                }}
              >
                <MailSentIcon sx={{ fontSize: 40, color: "#10B981" }} />
              </Box>
              <Typography
                variant="h6"
                sx={{ color: "#F8FAFC", fontWeight: 600, mb: 1 }}
              >
                Check Your Email
              </Typography>
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: alpha("#10B981", 0.1),
                  "& .MuiAlert-icon": { alignItems: "center" },
                }}
              >
                Password reset link has been sent to your email address. Please
                check your inbox.
              </Alert>
              <Typography variant="body2" sx={{ color: "#94A3B8", mb: 3 }}>
                Didn't receive the email? Check your spam folder or try again.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                fullWidth
                startIcon={<ArrowBack />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "#F8FAFC",
                  "&:hover": {
                    borderColor: "#F7921E",
                    backgroundColor: alpha("#F7921E", 0.05),
                  },
                }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <>
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
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your registered email"
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
                    background:
                      "linear-gradient(135deg, #F7921E 0%, #EA580C 100%)",
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
                    "Send Reset Link"
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
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
