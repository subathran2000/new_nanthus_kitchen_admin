import { useState, useCallback, useMemo } from "react";
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
  Card,
  Tabs,
  Tab,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  DragIndicator,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { MenuCategory, PrimaryCategory } from "../../types";

interface MenuCategoryForm {
  name: string;
  description: string;
  primaryCategoryId: string;
  isActive: boolean;
}

interface SortableCategoryItemProps {
  category: MenuCategory;
  canEdit: boolean;
  onEdit: (item: MenuCategory) => void;
  onDelete: (item: MenuCategory) => void;
}

function SortableCategoryItem({
  category,
  canEdit,
  onEdit,
  onDelete,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const itemsCount = category.items?.length || 0;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 8 : 1}
      sx={{
        mb: 1,
        borderRadius: 2,
        overflow: "hidden",
        border: isDragging ? "2px solid" : "1px solid",
        borderColor: isDragging ? "primary.main" : "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          bgcolor: isDragging ? alpha("#1976d2", 0.05) : "background.paper",
        }}
      >
        {canEdit && (
          <IconButton
            {...attributes}
            {...listeners}
            size="small"
            sx={{ cursor: "grab", mr: 1 }}
          >
            <DragIndicator />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {category.name}
            </Typography>
            <Chip
              label={category.isActive ? "Active" : "Inactive"}
              size="small"
              color={category.isActive ? "success" : "default"}
              sx={{ height: 20 }}
            />
          </Box>
          {category.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {category.description}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <Tooltip title="Menu items in this category">
              <Chip
                icon={<RestaurantIcon sx={{ fontSize: 16 }} />}
                label={`${itemsCount} items`}
                size="small"
                variant="outlined"
                sx={{ height: 24 }}
              />
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {canEdit && (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(category)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(category)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export function MenuCategoriesPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MenuCategory | null>(null);
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] =
    useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MenuCategoryForm>({
    defaultValues: {
      name: "",
      description: "",
      primaryCategoryId: "",
      isActive: true,
    },
  });

  // Fetch menu categories - corrected endpoint
  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery<MenuCategory[]>({
    queryKey: ["menuCategories"],
    queryFn: async () => {
      const response = await api.get("/menu/categories");
      return response.data;
    },
  });

  // Fetch primary categories for dropdown - corrected endpoint
  const { data: primaryCategories = [] } = useQuery({
    queryKey: ["primaryCategories"],
    queryFn: async () => {
      const response = await api.get("/menu/primary-categories");
      return response.data;
    },
  });

  // Filter and group categories by primary category
  const filteredCategories = useMemo(() => {
    if (selectedPrimaryCategory === "all") {
      return categories;
    }
    return categories.filter(
      (cat: MenuCategory) =>
        cat.primaryCategoryId === selectedPrimaryCategory ||
        cat.primaryCategory?.id === selectedPrimaryCategory,
    );
  }, [categories, selectedPrimaryCategory]);

  // Get categories for currently selected primary category (for drag sorting)
  const currentPrimaryCategoryCategories = useMemo(() => {
    if (selectedPrimaryCategory === "all") return [];
    return filteredCategories.sort(
      (a: MenuCategory, b: MenuCategory) => a.sortOrder - b.sortOrder,
    );
  }, [filteredCategories, selectedPrimaryCategory]);

  // Create mutation - corrected endpoint
  const createMutation = useMutation({
    mutationFn: async (data: MenuCategoryForm) => {
      return api.post("/menu/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
      queryClient.invalidateQueries({ queryKey: ["primaryCategories"] });
      toast.success("Menu category created successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to create menu category. Please check your input.";
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
      data: MenuCategoryForm;
    }) => {
      return api.patch(`/menu/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
      queryClient.invalidateQueries({ queryKey: ["primaryCategories"] });
      toast.success("Menu category updated successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to update menu category. Please try again.";
      toast.error(message);
    },
  });

  // Delete mutation - corrected endpoint
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/menu/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
      queryClient.invalidateQueries({ queryKey: ["primaryCategories"] });
      toast.success("Menu category deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Cannot delete this category. It may have menu items associated with it.";
      toast.error(message);
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.patch("/menu/categories/reorder", { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
      queryClient.invalidateQueries({ queryKey: ["primaryCategories"] });
    },
    onError: () => {
      toast.error("Failed to reorder categories");
      refetch();
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = currentPrimaryCategoryCategories.findIndex(
          (c: MenuCategory) => c.id === active.id,
        );
        const newIndex = currentPrimaryCategoryCategories.findIndex(
          (c: MenuCategory) => c.id === over.id,
        );

        const newOrder = arrayMove(
          currentPrimaryCategoryCategories,
          oldIndex,
          newIndex,
        );

        // Update local state optimistically - update full categories array
        const updatedCategories = categories.map((cat: MenuCategory) => {
          const newOrderIndex = newOrder.findIndex(
            (c: MenuCategory) => c.id === cat.id,
          );
          if (newOrderIndex !== -1) {
            return { ...cat, sortOrder: newOrderIndex };
          }
          return cat;
        });
        queryClient.setQueryData(["menuCategories"], updatedCategories);

        // Send reorder request with new sort orders
        const reorderItems = newOrder.map(
          (cat: MenuCategory, index: number) => ({
            id: cat.id,
            sortOrder: index,
          }),
        );

        reorderMutation.mutate(reorderItems);
      }
    },
    [
      currentPrimaryCategoryCategories,
      categories,
      queryClient,
      reorderMutation,
    ],
  );

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({
      name: "",
      description: "",
      primaryCategoryId:
        selectedPrimaryCategory !== "all" ? selectedPrimaryCategory : "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: MenuCategory) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description || "",
      primaryCategoryId:
        item.primaryCategory?.id || item.primaryCategoryId || "",
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    reset();
  };

  const handleOpenDelete = (item: MenuCategory) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: MenuCategoryForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Count items per primary category
  const getCategoryStats = (primaryCatId: string) => {
    const cats = categories.filter(
      (c: MenuCategory) =>
        c.primaryCategoryId === primaryCatId ||
        c.primaryCategory?.id === primaryCatId,
    );
    const itemsCount = cats.reduce(
      (sum: number, c: MenuCategory) => sum + (c.items?.length || 0),
      0,
    );
    return { categoriesCount: cats.length, itemsCount };
  };

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
            Menu Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage subcategories within primary categories. Select a primary
            category to reorder.
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
              Add Category
            </Button>
          )}
        </Box>
      </Box>

      {/* Tab Navigation for Primary Categories */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={selectedPrimaryCategory}
          onChange={(_, value) => setSelectedPrimaryCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                All Categories
                <Chip label={categories.length} size="small" />
              </Box>
            }
            value="all"
          />
          {primaryCategories.map((pc: PrimaryCategory) => {
            const stats = getCategoryStats(pc.id);
            return (
              <Tab
                key={pc.id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {pc.name}
                    <Chip
                      label={`${stats.categoriesCount}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
                value={pc.id}
              />
            );
          })}
        </Tabs>
      </Card>

      {/* Category List with Drag and Drop */}
      <Card sx={{ p: 2, minHeight: 300 }}>
        {isLoading ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Loading...
          </Typography>
        ) : filteredCategories.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No categories found.{" "}
            {selectedPrimaryCategory !== "all" && "Create one to get started."}
          </Typography>
        ) : selectedPrimaryCategory === "all" ? (
          // When showing all, just list them without drag
          <Box>
            {filteredCategories.map((category: MenuCategory) => (
              <Paper
                key={category.id}
                elevation={1}
                sx={{ mb: 1, borderRadius: 2, overflow: "hidden" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {category.name}
                      </Typography>
                      <Chip
                        label={category.primaryCategory?.name || "Unknown"}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ height: 20 }}
                      />
                      <Chip
                        label={category.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={category.isActive ? "success" : "default"}
                        sx={{ height: 20 }}
                      />
                    </Box>
                    {category.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {category.description}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <Chip
                        icon={<RestaurantIcon sx={{ fontSize: 16 }} />}
                        label={`${category.items?.length || 0} items`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                    </Box>
                  </Box>
                  {canEdit && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(category)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDelete(category)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          // When a specific primary category is selected, allow drag and drop
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentPrimaryCategoryCategories.map(
                (c: MenuCategory) => c.id,
              )}
              strategy={verticalListSortingStrategy}
            >
              {currentPrimaryCategoryCategories.map(
                (category: MenuCategory) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    canEdit={canEdit}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ),
              )}
            </SortableContext>
          </DndContext>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingItem ? "Edit Menu Category" : "Add Menu Category"}
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
                name="primaryCategoryId"
                control={control}
                rules={{ required: "Primary category is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.primaryCategoryId}>
                    <InputLabel>Primary Category</InputLabel>
                    <Select {...field} label="Primary Category">
                      {primaryCategories.map((cat: PrimaryCategory) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Menu Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingItem?.name}"? This action
            cannot be undone. All menu items in this category must be moved or
            deleted first.
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
