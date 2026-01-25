import { useState, useRef } from "react";
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
  MenuItem as MuiMenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Avatar,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import api, { getImageUrl } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type {
  MenuItem,
  MenuCategory,
  MeasurementType,
  DietaryInfo,
  Allergen,
} from "../../types";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const DIETARY_OPTIONS: { value: DietaryInfo; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "dairy_free", label: "Dairy Free" },
  { value: "nut_free", label: "Nut Free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
];

const ALLERGEN_OPTIONS: { value: Allergen; label: string }[] = [
  { value: "gluten", label: "Gluten" },
  { value: "dairy", label: "Dairy" },
  { value: "nuts", label: "Nuts" },
  { value: "eggs", label: "Eggs" },
  { value: "soy", label: "Soy" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "sesame", label: "Sesame" },
];

interface MeasurementPricing {
  measurementTypeId: string;
  price: number | string;
}

interface MenuItemForm {
  name: string;
  description: string;
  price?: number | string;
  categoryId: string;
  dietaryInfo: DietaryInfo[];
  allergens: Allergen[];
  isAvailable: boolean;
  hasMeasurements: boolean;
  measurements: MeasurementPricing[];
}

export function MenuItemsPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MenuItemForm>({
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      dietaryInfo: [],
      allergens: [],
      isAvailable: true,
      hasMeasurements: false,
      measurements: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "measurements",
  });

  const hasMeasurements = watch("hasMeasurements");

  // Fetch menu items - corrected endpoint
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const response = await api.get("/menu/items");
      return response.data;
    },
  });

  // Fetch menu categories for dropdown - corrected endpoint
  const { data: categories = [] } = useQuery({
    queryKey: ["menuCategories"],
    queryFn: async () => {
      const response = await api.get("/menu/categories");
      return response.data;
    },
  });

  // Fetch measurement types for pricing variations - corrected endpoint
  const { data: measurementTypes = [] } = useQuery({
    queryKey: ["measurementTypes"],
    queryFn: async () => {
      const response = await api.get("/measurements");
      return response.data;
    },
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("folder", "menu");
      const response = await api.post("/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
  });

  // Create mutation - corrected endpoint
  const createMutation = useMutation({
    mutationFn: async (data: MenuItemForm & { imageUrls?: string[] }) => {
      return api.post("/menu/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success("Menu item created successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to create menu item. Please check all required fields.";
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
      data: MenuItemForm & { imageUrls?: string[] };
    }) => {
      return api.patch(`/menu/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success("Menu item updated successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to update menu item. Please try again.";
      toast.error(message);
    },
  });

  // Delete mutation - corrected endpoint
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/menu/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success("Menu item deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to delete menu item. Please try again.";
      toast.error(message);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `"${file.name}" exceeds 1MB limit. Please choose a smaller image.`,
        );
        continue;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }
    setSelectedImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const adjustedIndex = index - existingImages.length;
      setSelectedImages((prev) => prev.filter((_, i) => i !== adjustedIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== adjustedIndex));
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    reset({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      dietaryInfo: [],
      allergens: [],
      isAvailable: true,
      hasMeasurements: false,
      measurements: [],
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages(item.imageUrls || []);
    reset({
      name: item.name,
      description: item.description || "",
      price: item.price || "",
      categoryId: item.categoryId || item.category?.id || "",
      dietaryInfo: item.dietaryInfo || [],
      allergens: item.allergens || [],
      isAvailable: item.isAvailable,
      hasMeasurements: item.hasMeasurements,
      measurements:
        item.measurements?.map((m) => ({
          measurementTypeId: m.measurementTypeId,
          price: m.price,
        })) || [],
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

  const handleOpenDelete = (item: MenuItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: MenuItemForm) => {
    let imageUrls = [...existingImages];

    // Upload new images if selected
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

    // Clean up measurements if not using them
    const submitData = {
      ...data,
      imageUrls,
      measurements: data.hasMeasurements
        ? data.measurements.map((m) => ({
            measurementTypeId: m.measurementTypeId,
            price:
              typeof m.price === "string" ? parseFloat(m.price) || 0 : m.price,
          }))
        : [],
      price: data.hasMeasurements
        ? undefined
        : typeof data.price === "string"
          ? parseFloat(data.price) || 0
          : data.price,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getDisplayPrice = (item: MenuItem) => {
    if (item.hasMeasurements && item.measurements?.length) {
      // Show each measurement with its price
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {item.measurements.map((m) => (
            <Typography key={m.id} variant="body2" sx={{ lineHeight: 1.2 }}>
              <strong>{m.measurementType?.name || "Unknown"}:</strong> $
              {Number(m.price).toFixed(2)}
            </Typography>
          ))}
        </Box>
      );
    }
    return item.price ? `$${Number(item.price).toFixed(2)}` : "-";
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
          {params.row.name?.[0]}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "price",
      headerName: "Price",
      width: 200,
      renderCell: (params) => getDisplayPrice(params.row),
    },
    {
      field: "category",
      headerName: "Category",
      flex: 1,
      minWidth: 120,
      valueGetter: (value: MenuCategory) => value?.name || "-",
    },
    {
      field: "dietaryInfo",
      headerName: "Dietary",
      width: 180,
      renderCell: (params) => (
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {params.value?.slice(0, 3).map((info: string) => (
            <Chip
              key={info}
              label={info.replace("_", " ").toUpperCase().slice(0, 2)}
              size="small"
              sx={{ height: 20 }}
            />
          ))}
          {params.value?.length > 3 && (
            <Chip
              label={`+${params.value.length - 3}`}
              size="small"
              sx={{ height: 20 }}
            />
          )}
        </Box>
      ),
    },
    {
      field: "isAvailable",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Available" : "Unavailable"}
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

  const allImages = [...existingImages, ...imagePreviews];

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
            Menu Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all menu items and their pricing variations
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
              Add Item
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={items}
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
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingItem ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={0.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Box display="flex" flexDirection="column" gap={2}>
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
                        helperText={errors.name?.message}
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
                  <Controller
                    name="categoryId"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.categoryId}>
                        <InputLabel>Category</InputLabel>
                        <Select {...field} label="Category">
                          {categories.map((cat: MenuCategory) => (
                            <MuiMenuItem key={cat.id} value={cat.id}>
                              {cat.primaryCategory?.name} → {cat.name}
                            </MuiMenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  {/* Pricing Section */}
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Controller
                      name="hasMeasurements"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          }
                          label="Multiple price variations (e.g., Small, Medium, Large)"
                        />
                      )}
                    />

                    {!hasMeasurements ? (
                      <Controller
                        name="price"
                        control={control}
                        rules={{
                          required: !hasMeasurements
                            ? "Price is required"
                            : false,
                          validate: (value) => {
                            if (!hasMeasurements) {
                              const numValue =
                                typeof value === "string"
                                  ? parseFloat(value)
                                  : value;
                              if (
                                isNaN(numValue as number) ||
                                (numValue as number) < 0
                              ) {
                                return "Price must be a positive number";
                              }
                            }
                            return true;
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Price"
                            type="number"
                            fullWidth
                            sx={{ mt: 2 }}
                            error={!!errors.price}
                            helperText={errors.price?.message}
                            placeholder="0.00"
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    $
                                  </InputAdornment>
                                ),
                              },
                              htmlInput: {
                                step: "0.01",
                                min: "0",
                              },
                            }}
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? "" : val);
                            }}
                          />
                        )}
                      />
                    ) : (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Price Variations
                        </Typography>
                        {fields.map((field, index) => (
                          <Box
                            key={field.id}
                            display="flex"
                            gap={1}
                            mb={1}
                            alignItems="center"
                          >
                            <Controller
                              name={`measurements.${index}.measurementTypeId`}
                              control={control}
                              rules={{ required: "Size is required" }}
                              render={({ field }) => (
                                <FormControl
                                  sx={{ minWidth: 150 }}
                                  size="small"
                                >
                                  <InputLabel>Size</InputLabel>
                                  <Select {...field} label="Size">
                                    {measurementTypes.map(
                                      (mt: MeasurementType) => (
                                        <MuiMenuItem key={mt.id} value={mt.id}>
                                          {mt.name}
                                        </MuiMenuItem>
                                      ),
                                    )}
                                  </Select>
                                </FormControl>
                              )}
                            />
                            <Controller
                              name={`measurements.${index}.price`}
                              control={control}
                              rules={{ required: "Price is required" }}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Price"
                                  type="number"
                                  size="small"
                                  sx={{ width: 120 }}
                                  placeholder="0.00"
                                  slotProps={{
                                    input: {
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          $
                                        </InputAdornment>
                                      ),
                                    },
                                    htmlInput: {
                                      step: "0.01",
                                      min: "0",
                                    },
                                  }}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? "" : val);
                                  }}
                                />
                              )}
                            />
                            <IconButton
                              size="small"
                              onClick={() => remove(index)}
                              color="error"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() =>
                            append({ measurementTypeId: "", price: 0 })
                          }
                        >
                          Add Variation
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Controller
                    name="dietaryInfo"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={DIETARY_OPTIONS}
                        getOptionLabel={(option) => option.label}
                        value={DIETARY_OPTIONS.filter((opt) =>
                          field.value?.includes(opt.value),
                        )}
                        onChange={(_, newValue) =>
                          field.onChange(newValue.map((v) => v.value))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Dietary Information" />
                        )}
                      />
                    )}
                  />

                  <Controller
                    name="allergens"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={ALLERGEN_OPTIONS}
                        getOptionLabel={(option) => option.label}
                        value={ALLERGEN_OPTIONS.filter((opt) =>
                          field.value?.includes(opt.value),
                        )}
                        onChange={(_, newValue) =>
                          field.onChange(newValue.map((v) => v.value))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Allergens" />
                        )}
                      />
                    )}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" flexDirection="column" gap={2}>
                  {/* Image Upload */}
                  <Box
                    sx={{
                      width: "100%",
                      minHeight: 150,
                      border: "2px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      p: 2,
                      "&:hover": { borderColor: "primary.main" },
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon
                      sx={{ fontSize: 32, color: "text.secondary" }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      Click to upload images
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max 1MB per image
                    </Typography>
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleImageChange}
                  />

                  {/* Image Previews */}
                  {allImages.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {allImages.map((img, index) => {
                        const isExisting = index < existingImages.length;
                        const imageUrl = isExisting ? getImageUrl(img) : img;
                        return (
                          <Box key={index} position="relative">
                            <Avatar
                              src={imageUrl}
                              variant="rounded"
                              sx={{ width: 60, height: 60 }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                bgcolor: "error.main",
                                color: "white",
                                "&:hover": { bgcolor: "error.dark" },
                                width: 20,
                                height: 20,
                              }}
                              onClick={() => removeImage(index, isExisting)}
                            >
                              <CloseIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  <Controller
                    name="isAvailable"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Available"
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Menu Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingItem?.name}"? This action
            cannot be undone.
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
