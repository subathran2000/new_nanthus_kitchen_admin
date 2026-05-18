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
  Grid,
  Avatar,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { format } from "date-fns";

import api, { getImageUrl, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type {
  Special,
  SpecialType,
  DayOfWeek,
  SpecialCategory,
} from "../../types";
import { PageHeader, ConfirmDialog, ImageUpload } from "@/components/shared";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

/**
 * Form interface for Specials
 *
 * Design Notes:
 * - Daily specials: Set dayOfWeek (shown all day on that day)
 * - Late night specials: Set specialCategory to 'late_night' (shown all day)
 * - displayStartDate/displayEndDate: For limited-time promotions (date only)
 */
interface SpecialForm {
  title: string;
  description: string;
  type: SpecialType;
  dayOfWeek: DayOfWeek | null;
  specialCategory: SpecialCategory | null;
  displayStartDate: Date | null;
  displayEndDate: Date | null;
  sortOrder: number;
  isActive: boolean;
}

const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const specialTypes: {
  value: SpecialType;
  label: string;
  description: string;
}[] = [
  {
    value: "daily",
    label: "Daily Special",
    description: "Shown on specific day of week",
  },
  {
    value: "game_time",
    label: "Game Time Deal",
    description: "Sports viewing specials",
  },
  {
    value: "day_time",
    label: "Day Time Special",
    description: "Lunch/dinner specials",
  },
  {
    value: "chef",
    label: "Chef's Special",
    description: "Chef recommendations",
  },
  {
    value: "seasonal",
    label: "Seasonal Special",
    description: "Limited time offerings",
  },
];

const specialCategories: {
  value: SpecialCategory;
  label: string;
  description: string;
}[] = [
  { value: "regular", label: "Regular", description: "Standard menu specials" },
  {
    value: "late_night",
    label: "Late Night",
    description: "Shown all day (late night menu)",
  },
];

export function SpecialsPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Special | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Special | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState<SpecialType | "all">("all");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SpecialForm>({
    defaultValues: {
      title: "",
      description: "",
      type: "daily",
      dayOfWeek: null,
      specialCategory: null,
      displayStartDate: null,
      displayEndDate: null,
      sortOrder: 0,
      isActive: true,
    },
  });

  const watchedType = watch("type");
  const watchedCategory = watch("specialCategory");

  // Fetch specials
  const {
    data: allSpecials = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["specials"],
    queryFn: async () => {
      const response = await api.get("/specials");
      return response.data;
    },
  });

  const specials =
    tabValue === "all"
      ? allSpecials
      : allSpecials.filter((s: Special) => s.type === tabValue);

  // Upload multiple images mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("folder", "specials");
      const response = await api.post("/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SpecialForm & { imageUrls?: string[] }) => {
      return api.post("/specials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specials"] });
      toast.success("Special created successfully");
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
      data: SpecialForm & { imageUrls?: string[] };
    }) => {
      return api.patch(`/specials/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specials"] });
      toast.success("Special updated successfully");
      handleCloseDialog();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/specials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specials"] });
      toast.success("Special deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleAddImages = (files: File[], previews: string[]) => {
    setSelectedImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    reset({
      title: "",
      description: "",
      type: tabValue === "all" ? "daily" : tabValue,
      dayOfWeek: null,
      specialCategory: null,
      displayStartDate: null,
      displayEndDate: null,
      sortOrder: specials.length,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Special) => {
    setEditingItem(item);
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages(item.imageUrls || []);
    reset({
      title: item.title,
      description: item.description || "",
      type: item.type,
      dayOfWeek: item.dayOfWeek || null,
      specialCategory: item.specialCategory || null,
      displayStartDate: item.displayStartDate
        ? new Date(item.displayStartDate)
        : null,
      displayEndDate: item.displayEndDate
        ? new Date(item.displayEndDate)
        : null,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    reset();
  };

  const handleOpenDelete = (item: Special) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: SpecialForm) => {
    let imageUrls = [...existingImages];

    if (selectedImages.length > 0) {
      try {
        const uploadResult = await uploadMutation.mutateAsync(selectedImages);
        const newUrls = uploadResult.map((r: { url: string }) => r.url);
        imageUrls = [...imageUrls, ...newUrls];
      } catch {
        toast.error("Failed to upload images. Please try again.");
        return;
      }
    }

    const submitData = { ...data, imageUrls };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "imageUrls",
      headerName: "Image",
      width: 70,
      renderCell: (params) => (
        <Avatar
          src={getImageUrl(params.value?.[0])}
          variant="rounded"
          sx={{ width: 40, height: 40 }}
        >
          {params.row.title?.[0]}
        </Avatar>
      ),
    },
    {
      field: "title",
      headerName: "Title",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => {
        const type = specialTypes.find((t) => t.value === params.value);
        return (
          <Chip
            label={type?.label || params.value}
            color={
              params.value === "daily"
                ? "primary"
                : params.value === "game_time"
                  ? "secondary"
                  : "warning"
            }
            size="small"
          />
        );
      },
    },
    {
      field: "dayOfWeek",
      headerName: "Day",
      width: 100,
      valueFormatter: (value: string) => {
        const day = daysOfWeek.find((d) => d.value === value);
        return day?.label || "-";
      },
    },
    {
      field: "specialCategory",
      headerName: "Category",
      width: 100,
      valueFormatter: (value: string) => {
        const cat = specialCategories.find((c) => c.value === value);
        return cat?.label || "-";
      },
    },
    {
      field: "displayStartDate",
      headerName: "Display From",
      width: 120,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "MMM d, yyyy") : "-",
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
      <PageHeader
        title="Specials"
        description="Manage daily specials, game day deals, and chef's specials"
        actions={
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
                Add Special
              </Button>
            )}
          </Box>
        }
      />

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="All" value="all" />
          <Tab label="Daily Specials" value="daily" />
          <Tab label="Game Time" value="game_time" />
          <Tab label="Chef's Specials" value="chef" />
          <Tab label="Seasonal" value="seasonal" />
        </Tabs>
      </Paper>

      <Paper sx={{ height: 550, width: "100%" }}>
        <DataGrid
          rows={specials}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: "sortOrder", sort: "asc" }] },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingItem ? "Edit Special" : "Add Special"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={0.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: "Title is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Title"
                        fullWidth
                        error={!!errors.title}
                        helperText={errors.title?.message}
                      />
                    )}
                  />
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                      />
                    )}
                  />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select {...field} label="Type">
                              {specialTypes.map((t) => (
                                <MenuItem key={t.value} value={t.value}>
                                  {t.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="specialCategory"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                              {...field}
                              label="Category"
                              value={field.value || ""}
                            >
                              <MenuItem value="">None</MenuItem>
                              {specialCategories.map((c) => (
                                <MenuItem key={c.value} value={c.value}>
                                  {c.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>

                  {watchedType === "daily" && (
                    <Controller
                      name="dayOfWeek"
                      control={control}
                      rules={{
                        required:
                          watchedType === "daily"
                            ? "Day is required for daily specials"
                            : false,
                      }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.dayOfWeek}>
                          <InputLabel>Day of Week</InputLabel>
                          <Select
                            {...field}
                            label="Day of Week"
                            value={field.value || ""}
                          >
                            {daysOfWeek.map((d) => (
                              <MenuItem key={d.value} value={d.value}>
                                {d.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  )}

                  {/* Info alert about scheduling behavior */}
                  {watchedType === "daily" && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Daily specials are shown all day on their designated day
                      of week.
                    </Alert>
                  )}
                  {watchedCategory === "late_night" && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Late night specials are displayed all day on the website.
                    </Alert>
                  )}

                  {/* Display Period - Date only, for promotional campaigns */}
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Display Period (optional - for limited time promotions)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="displayStartDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Display From"
                            value={field.value}
                            onChange={field.onChange}
                            slotProps={{
                              textField: { fullWidth: true },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="displayEndDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Display Until"
                            value={field.value}
                            onChange={field.onChange}
                            slotProps={{
                              textField: { fullWidth: true },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Controller
                    name="sortOrder"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Sort Order"
                        type="number"
                        fullWidth
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    )}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <ImageUpload
                    existingImages={existingImages}
                    newPreviews={imagePreviews}
                    onAddFiles={handleAddImages}
                    onRemoveExisting={removeExistingImage}
                    onRemoveNew={removeNewImage}
                    getImageUrl={getImageUrl}
                    multiple
                    maxSizeBytes={MAX_FILE_SIZE}
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                uploadMutation.isPending
              }
            >
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Special"
        description={`Are you sure you want to delete "${deletingItem?.title}"? This action cannot be undone.`}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
