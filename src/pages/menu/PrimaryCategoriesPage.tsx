import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Paper,
  alpha,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  ExpandMore,
  ExpandLess,
  Category as CategoryIcon,
  Restaurant as RestaurantIcon,
  Refresh as RefreshIcon,
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
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PrimaryCategory, MenuCategory } from "@/types";

interface FormData {
  name: string;
  description?: string;
  isActive: boolean;
}

interface SortableItemProps {
  category: PrimaryCategory;
  canEdit: boolean;
  onEdit: (item: PrimaryCategory) => void;
  onDelete: (item: PrimaryCategory) => void;
}

function SortableItem({
  category,
  canEdit,
  onEdit,
  onDelete,
}: SortableItemProps) {
  const [expanded, setExpanded] = useState(false);
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

  const categoriesCount = category.categories?.length || 0;
  const itemsCount =
    category.categories?.reduce(
      (sum, cat) => sum + (cat.items?.length || 0),
      0,
    ) || 0;

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
            <Tooltip title="Sub-categories">
              <Chip
                icon={<CategoryIcon sx={{ fontSize: 16 }} />}
                label={`${categoriesCount} categories`}
                size="small"
                variant="outlined"
                sx={{ height: 24 }}
              />
            </Tooltip>
            <Tooltip title="Menu items">
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
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(category)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {categoriesCount > 0 && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Expandable sub-categories list */}
      <Collapse in={expanded}>
        <Box
          sx={{
            bgcolor: "grey.50",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <List dense disablePadding>
            {category.categories?.map((subCat: MenuCategory) => (
              <ListItem key={subCat.id} sx={{ pl: 6 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CategoryIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={subCat.name}
                  secondary={`${subCat.items?.length || 0} items`}
                />
                <Chip
                  label={subCat.isActive ? "Active" : "Inactive"}
                  size="small"
                  color={subCat.isActive ? "success" : "default"}
                  sx={{ height: 20 }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>
    </Paper>
  );
}

export function PrimaryCategoriesPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrimaryCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PrimaryCategory | null>(
    null,
  );

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
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery<PrimaryCategory[]>({
    queryKey: ["primary-categories"],
    queryFn: async () => {
      const response = await api.get("/menu/primary-categories");
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { name: "", description: "", isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/menu/primary-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["primary-categories"] });
      toast.success("Primary category created successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to create primary category. Please check your input and try again.";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      api.patch(`/menu/primary-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["primary-categories"] });
      toast.success("Primary category updated successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to update primary category. Please try again.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/primary-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["primary-categories"] });
      toast.success("Primary category deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to delete primary category. It may have associated categories.";
      toast.error(message);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.patch("/menu/primary-categories/reorder", { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["primary-categories"] });
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
        const oldIndex = categories.findIndex(
          (c: PrimaryCategory) => c.id === active.id,
        );
        const newIndex = categories.findIndex(
          (c: PrimaryCategory) => c.id === over.id,
        );

        const newOrder = arrayMove(categories, oldIndex, newIndex);

        // Update local state optimistically
        queryClient.setQueryData(["primary-categories"], newOrder);

        // Send reorder request with new sort orders
        const reorderItems = newOrder.map(
          (cat: PrimaryCategory, index: number) => ({
            id: cat.id,
            sortOrder: index,
          }),
        );

        reorderMutation.mutate(reorderItems);
      }
    },
    [categories, queryClient, reorderMutation],
  );

  const handleOpenDialog = (item?: PrimaryCategory) => {
    if (item) {
      setEditingItem(item);
      setValue("name", item.name);
      setValue("description", item.description || "");
      setValue("isActive", item.isActive);
    } else {
      setEditingItem(null);
      reset({ name: "", description: "", isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    reset();
  };

  const handleOpenDelete = (item: PrimaryCategory) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const totalCategories = categories.reduce(
    (sum: number, pc: PrimaryCategory) => sum + (pc.categories?.length || 0),
    0,
  );
  const totalItems = categories.reduce(
    (sum: number, pc: PrimaryCategory) =>
      sum +
      (pc.categories?.reduce(
        (catSum: number, cat: MenuCategory) =>
          catSum + (cat.items?.length || 0),
        0,
      ) || 0),
    0,
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Primary Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage top-level menu categories. Drag to reorder.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Category
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Paper
          sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Typography variant="h5" fontWeight={700} color="primary.main">
            {categories.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Primary Categories
          </Typography>
        </Paper>
        <Paper
          sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Typography variant="h5" fontWeight={700} color="secondary.main">
            {totalCategories}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sub-categories
          </Typography>
        </Paper>
        <Paper
          sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Typography variant="h5" fontWeight={700} color="success.main">
            {totalItems}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Items
          </Typography>
        </Paper>
      </Box>

      {/* Sortable List */}
      <Card sx={{ p: 2 }}>
        {isLoading ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Loading...
          </Typography>
        ) : categories.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No primary categories yet. Create one to get started.
          </Typography>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c: PrimaryCategory) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {categories.map((category: PrimaryCategory) => (
                <SortableItem
                  key={category.id}
                  category={category}
                  canEdit={canEdit}
                  onEdit={handleOpenDialog}
                  onDelete={handleOpenDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingItem ? "Edit Primary Category" : "Create Primary Category"}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              margin="normal"
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={3}
              {...register("description")}
            />
            <FormControlLabel
              control={<Switch {...register("isActive")} defaultChecked />}
              label="Active"
              sx={{ mt: 2 }}
            />
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
        <DialogTitle>Delete Primary Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingItem?.name}"? This action
            cannot be undone. All associated menu categories must be deleted
            first.
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
