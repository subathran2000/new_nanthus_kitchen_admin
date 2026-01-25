import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Divider,
  Avatar,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return api.patch("/auth/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refreshUser();
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return api.post("/auth/change-password", data);
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError("confirmPassword", {
        message: "Passwords do not match",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage your account settings and preferences
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <PersonIcon />
                </Avatar>
              }
              title="Profile Information"
              subheader="Update your personal details"
            />
            <Divider />
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="center" mb={2}>
                    <Avatar sx={{ width: 80, height: 80, fontSize: "2rem" }}>
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </Avatar>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="firstName"
                        control={profileForm.control}
                        rules={{ required: "First name is required" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="First Name"
                            fullWidth
                            error={!!profileForm.formState.errors.firstName}
                            helperText={
                              profileForm.formState.errors.firstName?.message
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="lastName"
                        control={profileForm.control}
                        rules={{ required: "Last name is required" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Last Name"
                            fullWidth
                            error={!!profileForm.formState.errors.lastName}
                            helperText={
                              profileForm.formState.errors.lastName?.message
                            }
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                  <Controller
                    name="email"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email"
                        fullWidth
                        disabled
                        helperText="Email cannot be changed"
                      />
                    )}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={updateProfileMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Password Settings */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  <LockIcon />
                </Avatar>
              }
              title="Change Password"
              subheader="Update your password"
            />
            <Divider />
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Controller
                    name="currentPassword"
                    control={passwordForm.control}
                    rules={{ required: "Current password is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Current Password"
                        type={showCurrentPassword ? "text" : "password"}
                        fullWidth
                        error={!!passwordForm.formState.errors.currentPassword}
                        helperText={
                          passwordForm.formState.errors.currentPassword?.message
                        }
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() =>
                                    setShowCurrentPassword(!showCurrentPassword)
                                  }
                                  edge="end"
                                >
                                  {showCurrentPassword ? (
                                    <VisibilityOffIcon />
                                  ) : (
                                    <VisibilityIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="newPassword"
                    control={passwordForm.control}
                    rules={{
                      required: "New password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="New Password"
                        type={showNewPassword ? "text" : "password"}
                        fullWidth
                        error={!!passwordForm.formState.errors.newPassword}
                        helperText={
                          passwordForm.formState.errors.newPassword?.message
                        }
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                  }
                                  edge="end"
                                >
                                  {showNewPassword ? (
                                    <VisibilityOffIcon />
                                  ) : (
                                    <VisibilityIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="confirmPassword"
                    control={passwordForm.control}
                    rules={{
                      required: "Please confirm your password",
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Confirm New Password"
                        type={showConfirmPassword ? "text" : "password"}
                        fullWidth
                        error={!!passwordForm.formState.errors.confirmPassword}
                        helperText={
                          passwordForm.formState.errors.confirmPassword?.message
                        }
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  edge="end"
                                >
                                  {showConfirmPassword ? (
                                    <VisibilityOffIcon />
                                  ) : (
                                    <VisibilityIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      startIcon={<LockIcon />}
                      disabled={changePasswordMutation.isPending}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Info */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Account Information"
              subheader="Your account details"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Role
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {user?.role === "super_admin"
                        ? "Super Administrator"
                        : user?.role === "admin"
                          ? "Administrator"
                          : "Visitor"}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Account Status
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color={user?.isActive ? "success.main" : "error.main"}
                    >
                      {user?.isActive ? "Active" : "Inactive"}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Info */}
        <Grid size={{ xs: 12 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>New Nanthu's Kitchen Admin Dashboard</strong>
              <br />
              Version 1.0.0 • © {new Date().getFullYear()} New Nanthu's Kitchen.
              All rights reserved.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}
