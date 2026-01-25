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
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { MeasurementType } from "../../types";

interface MeasurementTypeForm {
  name: string;
}

export function MeasurementTypesPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MeasurementType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MeasurementType | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeasurementTypeForm>({
    defaultValues: {
      name: "",
    },
  });

  // Fetch measurement types - corrected endpoint
  const {
    data: measurementTypes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["measurementTypes"],
    queryFn: async () => {
      const response = await api.get("/measurements");
      return response.data;
    },
  });

  // Create mutation - corrected endpoint
  const createMutation = useMutation({
    mutationFn: async (data: MeasurementTypeForm) => {
      return api.post("/measurements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurementTypes"] });
      toast.success("Measurement type created successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to create measurement type. Please check if the name already exists.";
      toast.error(message);
    },
  });

  // Update mutation - corrected endpoint
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: MeasurementTypeForm;
    }) => {
      return api.patch(`/measurements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurementTypes"] });
      toast.success("Measurement type updated successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to update measurement type. Please try again.";
      toast.error(message);
    },
  });

  // Delete mutation - corrected endpoint
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurementTypes"] });
      toast.success("Measurement type deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Cannot delete this measurement type. It may be in use by menu items.";
      toast.error(message);
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({
      name: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: MeasurementType) => {
    setEditingItem(item);
    reset({
      name: item.name,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    reset();
  };

  const handleOpenDelete = (item: MeasurementType) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: MeasurementTypeForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "usageCount",
      headerName: "Used In",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0} items`}
          size="small"
          variant="outlined"
        />
      ),
    },
    ...(canEdit
      ? [
          {
            field: "actions",
            type: "actions" as const,
            headerName: "Actions",
            width: 100,
            getActions: (params: any) => [
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={() => handleOpenEdit(params.row)}
              />,
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={() => handleOpenDelete(params.row)}
              />,
            ],
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Measurement Types
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage portion sizes (e.g., Small, Medium, Large, Half, Full)
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Add Type
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={measurementTypes}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
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
          <DialogTitle>
            {editingItem ? "Edit Measurement Type" : "Add Measurement Type"}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={
                      errors.name?.message ||
                      "e.g., Small, Medium, Large, Half, Full"
                    }
                    placeholder="e.g., Small, Medium, Large"
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Measurement Type</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingItem?.name}"? This action
            cannot be undone. You cannot delete measurement types that are in
            use.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() =>
              deletingItem && deleteMutation.mutate(deletingItem.id)
            }
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
