import { useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
  PlayCircleOutline as VideoIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Label as SectionIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";

import api, { getImageUrl, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { GalleryItem, GallerySection, GalleryMediaType } from "../../types";
import { PageHeader, ConfirmDialog } from "@/components/shared";

// ── Constants ─────────────────────────────────────────────────────────────────

const IMAGE_MAX_BYTES = 1 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

// ── Section form ──────────────────────────────────────────────────────────────

interface SectionForm {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

// ── Item form ─────────────────────────────────────────────────────────────────

interface ItemForm {
  title: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  sortOrder: number;
}

// ── Tab panel ─────────────────────────────────────────────────────────────────

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return value === index ? <Box pt={3}>{children}</Box> : null;
}

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════

export function GalleryPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);

  // ── Section dialog state ───────────────────────────────────────────────────
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<GallerySection | null>(null);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<GallerySection | null>(null);

  // ── Item dialog state ──────────────────────────────────────────────────────
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null);

  // ── File upload state ──────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Lightbox ───────────────────────────────────────────────────────────────
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // ── Section form ───────────────────────────────────────────────────────────
  const {
    control: sControl,
    handleSubmit: sHandleSubmit,
    reset: sReset,
    formState: { errors: sErrors },
  } = useForm<SectionForm>({
    defaultValues: { name: "", description: "", sortOrder: 0, isActive: true },
  });

  // ── Item form ──────────────────────────────────────────────────────────────
  const {
    control: iControl,
    handleSubmit: iHandleSubmit,
    reset: iReset,
    formState: { errors: iErrors },
  } = useForm<ItemForm>({
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: sections = [], isLoading: sectionsLoading, refetch: refetchSections } =
    useQuery<GallerySection[]>({
      queryKey: ["gallery-categories"],
      queryFn: () => api.get("/gallery/categories").then((r) => r.data),
    });

  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems } =
    useQuery<GalleryItem[]>({
      queryKey: ["gallery-items"],
      queryFn: () => api.get("/gallery").then((r) => r.data),
    });

  // ── Section mutations ──────────────────────────────────────────────────────

  const createSection = useMutation({
    mutationFn: (d: SectionForm) => api.post("/gallery/categories", d).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast.success("Section created");
      closeSectionDialog();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SectionForm> }) =>
      api.patch(`/gallery/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast.success("Section updated");
      closeSectionDialog();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteSection = useMutation({
    mutationFn: (id: string) => api.delete(`/gallery/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
      toast.success("Section deleted — items moved to Uncategorised");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ── Item mutations ─────────────────────────────────────────────────────────

  const createItem = useMutation({
    mutationFn: (d: Partial<GalleryItem>) => api.post("/gallery", d).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
      toast.success("Item added");
      closeItemDialog();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GalleryItem> }) =>
      api.patch(`/gallery/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
      toast.success("Item updated");
      closeItemDialog();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/gallery/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
      toast.success("Item deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggleItem = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/gallery/${id}/toggle-active`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery-items"] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ── Section dialog handlers ────────────────────────────────────────────────

  function openCreateSection() {
    setEditingSection(null);
    sReset({ name: "", description: "", sortOrder: sections.length, isActive: true });
    setSectionDialogOpen(true);
  }

  function openEditSection(s: GallerySection) {
    setEditingSection(s);
    sReset({
      name: s.name,
      description: s.description ?? "",
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setSectionDialogOpen(true);
  }

  function closeSectionDialog() {
    setSectionDialogOpen(false);
    setEditingSection(null);
  }

  function onSectionSubmit(data: SectionForm) {
    if (editingSection) {
      updateSection.mutate({ id: editingSection.id, data });
    } else {
      createSection.mutate(data);
    }
  }

  // ── Item dialog handlers ───────────────────────────────────────────────────

  function openCreateItem() {
    setEditingItem(null);
    iReset({
      title: "",
      description: "",
      categoryId: "",
      isActive: true,
      sortOrder: items.length,
    });
    setSelectedFile(null);
    setFilePreview(null);
    setFileError("");
    setItemDialogOpen(true);
  }

  function openEditItem(item: GalleryItem) {
    setEditingItem(item);
    iReset({
      title: item.title,
      description: item.description ?? "",
      categoryId: item.categoryId ?? "",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setSelectedFile(null);
    setFilePreview(null);
    setFileError("");
    setItemDialogOpen(true);
  }

  function closeItemDialog() {
    setItemDialogOpen(false);
    setEditingItem(null);
    setSelectedFile(null);
    setFilePreview(null);
    setFileError("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      setFileError("Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed.");
      return;
    }
    if (isImage && file.size > IMAGE_MAX_BYTES) {
      setFileError(
        `Image must be under 1 MB (selected: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
      return;
    }
    if (isVideo && file.size > VIDEO_MAX_BYTES) {
      setFileError(
        `Video must be under 50 MB (selected: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
      return;
    }

    setFileError("");
    setSelectedFile(file);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(URL.createObjectURL(file));
    }
  }

  async function onItemSubmit(formData: ItemForm) {
    if (!editingItem && !selectedFile) {
      setFileError("Please select an image or video to upload.");
      return;
    }

    try {
      setUploading(true);
      let mediaUrl = editingItem?.mediaUrl ?? "";
      let mediaType: GalleryMediaType = editingItem?.mediaType ?? "image";

      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("folder", "gallery");
        const res = await api.post("/upload/single", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        mediaUrl = res.data.path;
        mediaType = selectedFile.type.startsWith("video/") ? "video" : "image";
      }

      const payload: Partial<GalleryItem> = {
        ...formData,
        categoryId: formData.categoryId || null,
        mediaUrl,
        mediaType,
        thumbnailUrl: mediaType === "image" ? mediaUrl : (editingItem?.thumbnailUrl ?? undefined),
      };

      if (editingItem) {
        updateItem.mutate({ id: editingItem.id, data: payload });
      } else {
        createItem.mutate(payload);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  const isSaving = uploading || createItem.isPending || updateItem.isPending;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function sectionLabel(categoryId?: string | null): string {
    if (!categoryId) return "Uncategorised";
    return sections.find((s) => s.id === categoryId)?.name ?? "Uncategorised";
  }

  // Group items by section for the card view
  const grouped: Array<{ section: GallerySection | null; items: GalleryItem[] }> = [];
  const activeSections = sections.filter((s) => s.isActive);
  for (const sec of activeSections) {
    const secItems = items.filter((i) => i.categoryId === sec.id);
    if (secItems.length > 0) grouped.push({ section: sec, items: secItems });
  }
  const uncategorised = items.filter(
    (i) => !i.categoryId || !sections.find((s) => s.id === i.categoryId),
  );
  if (uncategorised.length > 0) grouped.push({ section: null, items: uncategorised });

  const isLoading = sectionsLoading || itemsLoading;

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      <PageHeader
        title="Gallery"
        subtitle="Manage section titles and media displayed in the public gallery"
        action={
          <Box display="flex" gap={1} alignItems="center">
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={() => {
                  refetchSections();
                  refetchItems();
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {canEdit && activeTab === 0 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateSection}>
                Add Section
              </Button>
            )}
            {canEdit && activeTab === 1 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateItem}>
                Add Media
              </Button>
            )}
          </Box>
        }
      />

      {isLoading && <LinearProgress sx={{ mb: 1 }} />}

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}
      >
        <Tab icon={<SectionIcon fontSize="small" />} iconPosition="start" label="Sections" />
        <Tab icon={<ImageIcon fontSize="small" />} iconPosition="start" label="Media" />
      </Tabs>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 0 — Sections management
          ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={activeTab} index={0}>
        {sections.length === 0 && !sectionsLoading ? (
          <Box textAlign="center" py={6} color="text.secondary">
            <SectionIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
            <Typography variant="h6">No sections yet</Typography>
            <Typography variant="body2">
              Create sections to organise your gallery. Each section becomes a heading on
              the public gallery page.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Sort</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Items</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {sections.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {s.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {s.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          maxWidth: 240,
                        }}
                      >
                        {s.description ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{s.sortOrder}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={s.isActive ? "Visible" : "Hidden"}
                        color={s.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {items.filter((i) => i.categoryId === s.id).length}
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Edit section">
                          <IconButton size="small" onClick={() => openEditSection(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete section">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setDeletingSection(s);
                              setDeleteSectionDialogOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1 — Media items (grouped by section)
          ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={activeTab} index={1}>
        {items.length === 0 && !itemsLoading ? (
          <Box textAlign="center" py={6} color="text.secondary">
            <ImageIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
            <Typography variant="h6">No media yet</Typography>
            <Typography variant="body2">Click "Add Media" to upload images or videos.</Typography>
          </Box>
        ) : (
          grouped.map(({ section, items: secItems }) => (
            <Box key={section?.id ?? "uncategorised"} mb={4}>
              {/* Section heading */}
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mb={1.5}
                pb={0.75}
                sx={{ borderBottom: "2px solid", borderColor: "divider" }}
              >
                <Typography variant="h6" fontWeight={700}>
                  {section?.name ?? "Uncategorised"}
                </Typography>
                <Chip label={secItems.length} size="small" />
                {section && !section.isActive && (
                  <Chip label="Section hidden" size="small" color="warning" variant="outlined" />
                )}
              </Box>

              <Grid container spacing={2}>
                {secItems.map((item) => (
                  <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        opacity: item.isActive ? 1 : 0.55,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {/* Media thumbnail */}
                      <Box
                        sx={{ position: "relative", cursor: "pointer" }}
                        onClick={() => setLightboxItem(item)}
                      >
                        {item.mediaType === "video" ? (
                          <Box
                            sx={{
                              width: "100%",
                              height: 160,
                              bgcolor: "black",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              component="video"
                              src={getImageUrl(item.mediaUrl)}
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              muted
                              preload="metadata"
                            />
                            <VideoIcon
                              sx={{
                                position: "absolute",
                                fontSize: 44,
                                color: "white",
                                opacity: 0.85,
                                pointerEvents: "none",
                              }}
                            />
                          </Box>
                        ) : (
                          <CardMedia
                            component="img"
                            image={getImageUrl(item.mediaUrl)}
                            alt={item.title}
                            sx={{ height: 160, objectFit: "cover" }}
                          />
                        )}
                        {!item.isActive && (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              bgcolor: alpha("#000", 0.4),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="caption" color="white" fontWeight={700}>
                              HIDDEN
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <CardContent sx={{ flex: 1, pb: 0, pt: 1 }}>
                        <Chip
                          label={item.mediaType}
                          size="small"
                          icon={item.mediaType === "video" ? <VideoIcon /> : <ImageIcon />}
                          variant="outlined"
                          sx={{ fontSize: "0.6rem", mb: 0.5 }}
                        />
                        <Typography variant="subtitle2" noWrap fontWeight={600}>
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </CardContent>

                      {canEdit && (
                        <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                          <Tooltip title={item.isActive ? "Hide" : "Show"}>
                            <IconButton size="small" onClick={() => toggleItem.mutate(item.id)}>
                              {item.isActive ? (
                                <VisibilityOffIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditItem(item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeletingItem(item);
                                setDeleteItemDialogOpen(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        )}
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════
          Section dialog
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={sectionDialogOpen} onClose={closeSectionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSection ? "Edit Section" : "New Gallery Section"}
        </DialogTitle>
        <Box component="form" onSubmit={sHandleSubmit(onSectionSubmit)}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Controller
              name="name"
              control={sControl}
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Section Title"
                  fullWidth
                  error={!!sErrors.name}
                  helperText={
                    sErrors.name?.message ??
                    "This will appear as the heading on the public gallery page"
                  }
                />
              )}
            />
            <Controller
              name="description"
              control={sControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description (optional)"
                  fullWidth
                  multiline
                  rows={2}
                  helperText="Short subtitle shown below the section heading"
                />
              )}
            />
            <Controller
              name="sortOrder"
              control={sControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Sort Order"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="Lower numbers appear first"
                />
              )}
            />
            <Controller
              name="isActive"
              control={sControl}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Visible on website"
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeSectionDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createSection.isPending || updateSection.isPending}
            >
              {createSection.isPending || updateSection.isPending
                ? "Saving…"
                : editingSection
                  ? "Save Changes"
                  : "Create Section"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          Item dialog
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={itemDialogOpen} onClose={closeItemDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? "Edit Media" : "Add Media"}</DialogTitle>
        <Box component="form" onSubmit={iHandleSubmit(onItemSubmit)}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Upload zone */}
            <Box>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                sx={{
                  border: "2px dashed",
                  borderColor: fileError ? "error.main" : "divider",
                  borderRadius: 2,
                  minHeight: 130,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                {filePreview ? (
                  selectedFile?.type.startsWith("video/") ? (
                    <Box
                      component="video"
                      src={filePreview}
                      controls
                      sx={{ maxHeight: 200, maxWidth: "100%", borderRadius: "6px" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={filePreview}
                      alt="preview"
                      sx={{
                        maxHeight: 200,
                        maxWidth: "100%",
                        objectFit: "contain",
                        borderRadius: 1,
                      }}
                    />
                  )
                ) : editingItem?.mediaUrl ? (
                  editingItem.mediaType === "video" ? (
                    <Box
                      component="video"
                      src={getImageUrl(editingItem.mediaUrl)}
                      controls
                      sx={{ maxHeight: 200, maxWidth: "100%", borderRadius: "6px" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={getImageUrl(editingItem.mediaUrl)}
                      alt="current"
                      sx={{
                        maxHeight: 200,
                        maxWidth: "100%",
                        objectFit: "contain",
                        borderRadius: 1,
                      }}
                    />
                  )
                ) : (
                  <>
                    <UploadIcon sx={{ fontSize: 36, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Click to select image or video
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Images ≤ 1 MB &nbsp;|&nbsp; Videos ≤ 50 MB
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      JPEG, PNG, GIF, WebP &nbsp;|&nbsp; MP4, WebM, MOV
                    </Typography>
                  </>
                )}
              </Box>
              {(filePreview || editingItem?.mediaUrl) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  textAlign="center"
                  mt={0.5}
                >
                  Click above to change file
                </Typography>
              )}
              {fileError && (
                <Typography variant="caption" color="error" display="block" mt={0.5}>
                  {fileError}
                </Typography>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
                hidden
                onChange={handleFileChange}
              />
            </Box>

            {/* Title */}
            <Controller
              name="title"
              control={iControl}
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  fullWidth
                  error={!!iErrors.title}
                  helperText={iErrors.title?.message}
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={iControl}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth multiline rows={2} />
              )}
            />

            {/* Section / Category */}
            <Controller
              name="categoryId"
              control={iControl}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select {...field} label="Section" value={field.value ?? ""}>
                    <MenuItem value="">
                      <em>Uncategorised</em>
                    </MenuItem>
                    {sections.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                        {!s.isActive && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            ml={1}
                          >
                            (hidden)
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Sort order */}
            <Controller
              name="sortOrder"
              control={iControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Sort Order"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              )}
            />

            {/* Active */}
            <Controller
              name="isActive"
              control={iControl}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Visible on website"
                />
              )}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={closeItemDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? "Saving…" : editingItem ? "Save Changes" : "Add to Gallery"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          Lightbox
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!lightboxItem}
        onClose={() => setLightboxItem(null)}
        maxWidth="md"
        fullWidth
      >
        {lightboxItem && (
          <>
            <DialogTitle sx={{ pb: 0 }}>
              {lightboxItem.title}
              <Typography variant="caption" color="text.secondary" display="block">
                {sectionLabel(lightboxItem.categoryId)} · {lightboxItem.mediaType}
              </Typography>
            </DialogTitle>
            <DialogContent>
              {lightboxItem.mediaType === "video" ? (
                <Box
                  component="video"
                  src={getImageUrl(lightboxItem.mediaUrl)}
                  controls
                  autoPlay
                  sx={{ width: "100%", borderRadius: 2, maxHeight: "70vh" }}
                />
              ) : (
                <Box
                  component="img"
                  src={getImageUrl(lightboxItem.mediaUrl)}
                  alt={lightboxItem.title}
                  sx={{
                    width: "100%",
                    objectFit: "contain",
                    maxHeight: "70vh",
                    borderRadius: 1,
                  }}
                />
              )}
              {lightboxItem.description && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {lightboxItem.description}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLightboxItem(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          Delete confirmations
          ════════════════════════════════════════════════════════════════════ */}
      <ConfirmDialog
        open={deleteSectionDialogOpen}
        title="Delete Section"
        description={`Delete section "${deletingSection?.name}"? Media items in this section will become uncategorised — they won't be deleted.`}
        confirmLabel="Delete Section"
        loading={deleteSection.isPending}
        onConfirm={() => {
          if (deletingSection) deleteSection.mutate(deletingSection.id);
          setDeleteSectionDialogOpen(false);
          setDeletingSection(null);
        }}
        onCancel={() => {
          setDeleteSectionDialogOpen(false);
          setDeletingSection(null);
        }}
      />

      <ConfirmDialog
        open={deleteItemDialogOpen}
        title="Delete Media"
        description={`Delete "${deletingItem?.title}"? The media file will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleteItem.isPending}
        onConfirm={() => {
          if (deletingItem) deleteItem.mutate(deletingItem.id);
          setDeleteItemDialogOpen(false);
          setDeletingItem(null);
        }}
        onCancel={() => {
          setDeleteItemDialogOpen(false);
          setDeletingItem(null);
        }}
      />
    </Box>
  );
}
