import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Avatar,
  InputAdornment,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { format } from "date-fns";

import api, { getErrorMessage } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { User, UserRole } from "../../types";
import { PageHeader, ConfirmDialog } from "@/components/shared";

interface UserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "visitor",
      isActive: true,
    },
  });

  // Fetch users
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
  });

  const users: User[] = data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: UserForm) => {
      return api.post("/auth/register", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      handleCloseDialog();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<UserForm>;
    }) => {
      return api.patch(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      handleCloseDialog();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setShowPassword(false);
    reset({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "visitor",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: User) => {
    setEditingItem(item);
    setShowPassword(false);
    reset({
      email: item.email,
      password: "",
      firstName: item.firstName,
      lastName: item.lastName,
      role: item.role,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setShowPassword(false);
    reset();
  };

  const handleOpenDelete = (item: User) => {
    if (item.id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: UserForm) => {
    if (editingItem) {
      // For edit, don't send password if empty
      const updateData: Partial<UserForm> = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
      };
      if (data.password) {
        updateData.password = data.password;
      }
      updateMutation.mutate({ id: editingItem.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "avatar",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <Avatar sx={{ width: 32, height: 32 }}>
          {params.row.firstName?.[0]}
          {params.row.lastName?.[0]}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
      valueGetter: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      renderCell: (params) => {
        const roleLabels = {
          super_admin: "Super Admin",
          admin: "Admin",
          manager: "Manager",
          visitor: "Visitor",
        };
        const roleColors = {
          super_admin: "error" as const,
          admin: "primary" as const,
          manager: "info" as const,
          visitor: "default" as const,
        };
        return (
          <Chip
            label={roleLabels[params.value as UserRole] || params.value}
            color={roleColors[params.value as UserRole] || "default"}
            size="small"
          />
        );
      },
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "lastLoginAt",
      headerName: "Last Login",
      width: 150,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "MMM d, yyyy h:mm a") : "Never",
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 130,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "MMM d, yyyy") : "-",
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => {
        const canEdit =
          currentUser?.role === "super_admin" ||
          (currentUser?.role === "admin" && params.row.role === "visitor");
        const canDelete =
          params.row.id !== currentUser?.id &&
          (currentUser?.role === "super_admin"
            ? params.row.role !== "super_admin"
            : currentUser?.role === "admin" && params.row.role === "visitor");

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            onClick={() => handleOpenEdit(params.row)}
            disabled={!canEdit}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleOpenDelete(params.row)}
            disabled={!canDelete}
          />,
        ];
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        description="Manage admin accounts and staff access"
        actions={
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Add User
            </Button>
          </Box>
        }
      />

      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: "createdAt", sort: "desc" }] },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editingItem ? "Edit User" : "Add User"}</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={!!editingItem}
                    autoComplete="off"
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                rules={{
                  required: editingItem ? false : "Password is required",
                  minLength: editingItem
                    ? undefined
                    : {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                  pattern: editingItem
                    ? undefined
                    : {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                        message: "Must include uppercase, lowercase, number, and special character",
                      },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={
                      editingItem
                        ? "New Password (leave blank to keep current)"
                        : "Password"
                    }
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    autoComplete="new-password"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? (
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
              <Box display="flex" gap={2}>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: "First name is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: "Last name is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Box>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label="Role">
                      {currentUser?.role === "super_admin" ? (
                        [
                          <MenuItem key="super_admin" value="super_admin">
                            Super Admin
                          </MenuItem>,
                          <MenuItem key="admin" value="admin">
                            Admin
                          </MenuItem>,
                          <MenuItem key="manager" value="manager">
                            Manager
                          </MenuItem>,
                          <MenuItem key="visitor" value="visitor">
                            Visitor
                          </MenuItem>,
                        ]
                      ) : currentUser?.role === "admin" ? (
                        [
                          <MenuItem key="manager" value="manager">
                            Manager
                          </MenuItem>,
                          <MenuItem key="visitor" value="visitor">
                            Visitor
                          </MenuItem>,
                        ]
                      ) : (
                        <MenuItem value="visitor">Visitor</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${deletingItem?.firstName} ${deletingItem?.lastName}"? This action cannot be undone.`}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
