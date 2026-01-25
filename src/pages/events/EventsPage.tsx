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
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Avatar,
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
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api, { getImageUrl } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Event, EventType } from "../../types";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "live_music", label: "Live Music" },
  { value: "sports_viewing", label: "Sports Viewing" },
  { value: "trivia_night", label: "Trivia Night" },
  { value: "karaoke", label: "Karaoke" },
  { value: "private_party", label: "Private Party" },
  { value: "special_event", label: "Special Event" },
];

interface EventForm {
  title: string;
  description: string;
  type: EventType;
  displayStartDate: Date | null;
  displayEndDate: Date | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  location: string;
  ticketLink: string;
  capacity: number | null;
  registrationRequired: boolean;
  isActive: boolean;
}

export function EventsPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Event | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventForm>({
    defaultValues: {
      title: "",
      description: "",
      type: "special_event",
      displayStartDate: null,
      displayEndDate: null,
      eventStartDate: null,
      eventEndDate: null,
      location: "",
      ticketLink: "",
      capacity: null,
      registrationRequired: false,
      isActive: true,
    },
  });

  // Fetch events
  const {
    data: events = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    },
  });

  // Upload multiple images mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("folder", "events");
      const response = await api.post("/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: EventForm & { imageUrls?: string[] }) => {
      return api.post("/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to create event. Please check all required fields.";
      toast.error(message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: EventForm & { imageUrls?: string[] };
    }) => {
      return api.patch(`/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to update event. Please try again.";
      toast.error(message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to delete event. It may be referenced elsewhere.";
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
      title: "",
      description: "",
      type: "special_event",
      displayStartDate: null,
      displayEndDate: null,
      eventStartDate: null,
      eventEndDate: null,
      location: "",
      ticketLink: "",
      capacity: null,
      registrationRequired: false,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Event) => {
    setEditingItem(item);
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages(item.imageUrls || []);
    reset({
      title: item.title,
      description: item.description || "",
      type: item.type || "special_event",
      displayStartDate: item.displayStartDate
        ? new Date(item.displayStartDate)
        : null,
      displayEndDate: item.displayEndDate
        ? new Date(item.displayEndDate)
        : null,
      eventStartDate: item.eventStartDate
        ? new Date(item.eventStartDate)
        : null,
      eventEndDate: item.eventEndDate ? new Date(item.eventEndDate) : null,
      location: item.location || "",
      ticketLink: item.ticketLink || "",
      capacity: item.capacity || null,
      registrationRequired: item.registrationRequired || false,
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

  const handleOpenDelete = (item: Event) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: EventForm) => {
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

  const getEventTypeLabel = (type: EventType) => {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found?.label || type;
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
      minWidth: 180,
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={getEventTypeLabel(params.value)}
          size="small"
          color="primary"
        />
      ),
    },
    {
      field: "eventStartDate",
      headerName: "Event Date",
      width: 160,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "MMM d, yyyy h:mm a") : "-",
    },
    {
      field: "displayStartDate",
      headerName: "Display From",
      width: 130,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "MMM d, yyyy") : "-",
    },
    {
      field: "displayEndDate",
      headerName: "Display Until",
      width: 130,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "MMM d, yyyy") : "-",
    },
    {
      field: "location",
      headerName: "Location",
      width: 120,
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

  const allImages = [...existingImages, ...imagePreviews];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage events, promotions, and announcements
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
                Add Event
              </Button>
            )}
          </Box>
        </Box>

        <Paper sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={events}
            columns={columns}
            loading={isLoading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: {
                sortModel: [{ field: "eventStartDate", sort: "desc" }],
              },
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
              {editingItem ? "Edit Event" : "Add Event"}
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
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Event Type</InputLabel>
                          <Select {...field} label="Event Type">
                            {EVENT_TYPES.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />

                    {/* Display Period */}
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Display Period (when the event is shown on website)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="displayStartDate"
                          control={control}
                          rules={{ required: "Display start date is required" }}
                          render={({ field }) => (
                            <DateTimePicker
                              label="Display From"
                              value={field.value}
                              onChange={field.onChange}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.displayStartDate,
                                  helperText: errors.displayStartDate?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="displayEndDate"
                          control={control}
                          rules={{ required: "Display end date is required" }}
                          render={({ field }) => (
                            <DateTimePicker
                              label="Display Until"
                              value={field.value}
                              onChange={field.onChange}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.displayEndDate,
                                  helperText: errors.displayEndDate?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    {/* Event Date/Time */}
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Event Date/Time (when the event actually happens)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="eventStartDate"
                          control={control}
                          rules={{ required: "Event start date is required" }}
                          render={({ field }) => (
                            <DateTimePicker
                              label="Event Start"
                              value={field.value}
                              onChange={field.onChange}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.eventStartDate,
                                  helperText: errors.eventStartDate?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="eventEndDate"
                          control={control}
                          render={({ field }) => (
                            <DateTimePicker
                              label="Event End"
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
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Location"
                          fullWidth
                          placeholder="e.g., Markham Branch, Main Hall"
                        />
                      )}
                    />
                    <Controller
                      name="ticketLink"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Ticket/Registration Link"
                          fullWidth
                          placeholder="https://..."
                        />
                      )}
                    />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="capacity"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Capacity"
                              type="number"
                              fullWidth
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                )
                              }
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="registrationRequired"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.checked)
                                  }
                                />
                              }
                              label="Registration Required"
                              sx={{ mt: 1 }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {/* Multi-image upload */}
                    <Box
                      sx={{
                        width: "100%",
                        minHeight: 120,
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
                          // For existing images (first N items), use getImageUrl
                          // For new previews (data URLs), use as-is
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(index, isExisting);
                                }}
                              >
                                <CloseIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deletingItem?.title}"? This
              action cannot be undone.
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
    </LocalizationProvider>
  );
}
