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
  Stack,
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
  Close as CloseIcon,
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

// ── Staged file (for multi-upload) ────────────────────────────────────────────

interface StagedFile {
  file: File;
  preview: string; // data URL for images, object URL for videos
  mediaType: GalleryMediaType;
  title: string;   // editable per-file
  error: string;
}

// ── Section form ──────────────────────────────────────────────────────────────

interface SectionForm {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

// ── Item edit form (single item) ──────────────────────────────────────────────

interface ItemEditForm {
  title: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  sortOrder: number;
}

// ── Tab panel helper ──────────────────────────────────────────────────────────

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box pt={3}>{children}</Box> : null;
}

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════

export function GalleryPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);

  // ── Section dialog ─────────────────────────────────────────────────────────
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<GallerySection | null>(null);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<GallerySection | null>(null);

  // ── Add-media dialog (multi-file) ──────────────────────────────────────────
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addUploading, setAddUploading] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // ── Edit-media dialog (single item) ───────────────────────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editFileError, setEditFileError] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // ── Delete-media dialog ────────────────────────────────────────────────────
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null);

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

  // ── Edit item form ─────────────────────────────────────────────────────────
  const {
    control: eControl,
    handleSubmit: eHandleSubmit,
    reset: eReset,
    formState: { errors: eErrors },
  } = useForm<ItemEditForm>({
    defaultValues: { title: "", description: "", categoryId: "", isActive: true, sortOrder: 0 },
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

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createSection = useMutation({
    mutationFn: (d: SectionForm) => api.post("/gallery/categories", d).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gallery-categories"] }); toast.success("Section created"); closeSectionDialog(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SectionForm> }) =>
      api.patch(`/gallery/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gallery-categories"] }); toast.success("Section updated"); closeSectionDialog(); },
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

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GalleryItem> }) =>
      api.patch(`/gallery/${id}`, data).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gallery-items"] }); toast.success("Item updated"); closeEditDialog(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/gallery/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gallery-items"] }); toast.success("Item deleted"); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggleItem = useMutation({
    mutationFn: (id: string) => api.patch(`/gallery/${id}/toggle-active`).then((r) => r.data),
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
    sReset({ name: s.name, description: s.description ?? "", sortOrder: s.sortOrder, isActive: s.isActive });
    setSectionDialogOpen(true);
  }

  function closeSectionDialog() { setSectionDialogOpen(false); setEditingSection(null); }

  function onSectionSubmit(data: SectionForm) {
    editingSection ? updateSection.mutate({ id: editingSection.id, data }) : createSection.mutate(data);
  }

  // ── Add-media dialog handlers ──────────────────────────────────────────────

  function openAddDialog() {
    setStagedFiles([]);
    setAddCategoryId("");
    setAddDialogOpen(true);
  }

  function closeAddDialog() {
    // Revoke any object URLs to avoid memory leak
    stagedFiles.forEach((f) => { if (f.mediaType === "video") URL.revokeObjectURL(f.preview); });
    setStagedFiles([]);
    setAddDialogOpen(false);
  }

  function validateAndStageFiles(fileList: FileList) {
    const next: StagedFile[] = [];
    for (const file of Array.from(fileList)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      let error = "";

      if (!isImage && !isVideo) {
        error = "Not a supported image or video type";
      } else if (isImage && file.size > IMAGE_MAX_BYTES) {
        error = `Exceeds 1 MB image limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      } else if (isVideo && file.size > VIDEO_MAX_BYTES) {
        error = `Exceeds 50 MB video limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      }

      const mediaType: GalleryMediaType = isVideo ? "video" : "image";
      // Title defaults to filename without extension
      const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

      // Generate preview
      if (error) {
        next.push({ file, preview: "", mediaType, title, error });
      } else if (isImage) {
        // We'll fill preview asynchronously below
        next.push({ file, preview: "", mediaType, title, error });
      } else {
        next.push({ file, preview: URL.createObjectURL(file), mediaType, title, error });
      }
    }

    // Read image previews
    setStagedFiles((prev) => {
      const combined = [...prev, ...next];
      // Read data URLs for images
      combined.forEach((staged, idx) => {
        if (staged.mediaType === "image" && !staged.preview && !staged.error) {
          const reader = new FileReader();
          reader.onload = () => {
            setStagedFiles((cur) =>
              cur.map((s, i) => (i === idx + prev.length ? { ...s, preview: reader.result as string } : s)),
            );
          };
          reader.readAsDataURL(staged.file);
        }
      });
      return combined;
    });
  }

  function handleAddFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) validateAndStageFiles(e.target.files);
    if (addFileInputRef.current) addFileInputRef.current.value = "";
  }

  function handleAddDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) validateAndStageFiles(e.dataTransfer.files);
  }

  function removeStagedFile(index: number) {
    setStagedFiles((prev) => {
      const file = prev[index];
      if (file.mediaType === "video" && file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function updateStagedTitle(index: number, title: string) {
    setStagedFiles((prev) => prev.map((f, i) => (i === index ? { ...f, title } : f)));
  }

  async function onAddSubmit() {
    const valid = stagedFiles.filter((f) => !f.error);
    if (valid.length === 0) { toast.error("No valid files to upload"); return; }

    setAddUploading(true);
    try {
      // Upload all files concurrently
      const uploaded = await Promise.all(
        valid.map(async (staged) => {
          const fd = new FormData();
          fd.append("file", staged.file);
          fd.append("folder", "gallery");
          const res = await api.post("/upload/single", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return {
            title: staged.title || staged.file.name,
            categoryId: addCategoryId || undefined,
            mediaType: staged.mediaType,
            mediaUrl: res.data.url,
            thumbnailUrl: staged.mediaType === "image" ? res.data.url : undefined,
            isActive: true,
            sortOrder: items.length,
          };
        }),
      );

      await api.post("/gallery/bulk-items", { items: uploaded });
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
      toast.success(`${uploaded.length} item${uploaded.length > 1 ? "s" : ""} added`);
      closeAddDialog();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddUploading(false);
    }
  }

  // ── Edit-media dialog handlers ─────────────────────────────────────────────

  function openEditDialog(item: GalleryItem) {
    setEditingItem(item);
    eReset({ title: item.title, description: item.description ?? "", categoryId: item.categoryId ?? "", isActive: item.isActive, sortOrder: item.sortOrder });
    setEditFile(null);
    setEditPreview(null);
    setEditFileError("");
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
    setEditingItem(null);
    setEditFile(null);
    setEditPreview(null);
    setEditFileError("");
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) { setEditFileError("Only images and videos are allowed."); return; }
    if (isImage && file.size > IMAGE_MAX_BYTES) { setEditFileError(`Image must be under 1 MB`); return; }
    if (isVideo && file.size > VIDEO_MAX_BYTES) { setEditFileError(`Video must be under 50 MB`); return; }

    setEditFileError("");
    setEditFile(file);
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => setEditPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setEditPreview(URL.createObjectURL(file));
    }
  }

  async function onEditSubmit(formData: ItemEditForm) {
    if (!editingItem) return;
    try {
      let mediaUrl = editingItem.mediaUrl;
      let mediaType: GalleryMediaType = editingItem.mediaType;

      if (editFile) {
        const fd = new FormData();
        fd.append("file", editFile);
        fd.append("folder", "gallery");
        const res = await api.post("/upload/single", fd, { headers: { "Content-Type": "multipart/form-data" } });
        mediaUrl = res.data.url;
        mediaType = editFile.type.startsWith("video/") ? "video" : "image";
      }

      updateItem.mutate({
        id: editingItem.id,
        data: {
          ...formData,
          categoryId: formData.categoryId || null,
          mediaUrl,
          mediaType,
          thumbnailUrl: mediaType === "image" ? mediaUrl : editingItem.thumbnailUrl,
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // ── Grouped view ───────────────────────────────────────────────────────────

  const grouped: Array<{ section: GallerySection | null; items: GalleryItem[] }> = [];
  const activeSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const sec of activeSections) {
    const secItems = items.filter((i) => i.categoryId === sec.id);
    if (secItems.length > 0) grouped.push({ section: sec, items: secItems });
  }
  const uncategorised = items.filter((i) => !i.categoryId || !sections.find((s) => s.id === i.categoryId));
  if (uncategorised.length > 0) grouped.push({ section: null, items: uncategorised });

  function sectionLabel(categoryId?: string | null) {
    if (!categoryId) return "Uncategorised";
    return sections.find((s) => s.id === categoryId)?.name ?? "Uncategorised";
  }

  const isLoading = sectionsLoading || itemsLoading;
  const isSectionSaving = createSection.isPending || updateSection.isPending;

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      <PageHeader
        title="Gallery"
        description="Manage section titles and media displayed in the public gallery"
        actions={
          <Box display="flex" gap={1} alignItems="center">
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => { refetchSections(); refetchItems(); }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {canEdit && activeTab === 0 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateSection}>
                Add Section
              </Button>
            )}
            {canEdit && activeTab === 1 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
                Add Media
              </Button>
            )}
          </Box>
        }
      />

      {isLoading && <LinearProgress sx={{ mb: 1 }} />}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
        <Tab icon={<SectionIcon fontSize="small" />} iconPosition="start" label="Sections" />
        <Tab icon={<ImageIcon fontSize="small" />} iconPosition="start" label="Media" />
      </Tabs>

      {/* ══ TAB 0 — Sections ══════════════════════════════════════════════════ */}
      <TabPanel value={activeTab} index={0}>
        {sections.length === 0 && !sectionsLoading ? (
          <Box textAlign="center" py={6} color="text.secondary">
            <SectionIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
            <Typography variant="h6">No sections yet</Typography>
            <Typography variant="body2">Create sections to organise your gallery.</Typography>
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
                    <TableCell><Typography variant="body2" fontWeight={600}>{s.name}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{s.slug}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 240 }}>
                        {s.description ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{s.sortOrder}</TableCell>
                    <TableCell align="center">
                      <Chip label={s.isActive ? "Visible" : "Hidden"} color={s.isActive ? "success" : "default"} size="small" />
                    </TableCell>
                    <TableCell align="center">{items.filter((i) => i.categoryId === s.id).length}</TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditSection(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => { setDeletingSection(s); setDeleteSectionDialogOpen(true); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ══ TAB 1 — Media ════════════════════════════════════════════════════ */}
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
              <Box display="flex" alignItems="center" gap={1} mb={1.5} pb={0.75} sx={{ borderBottom: "2px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700}>{section?.name ?? "Uncategorised"}</Typography>
                <Chip label={secItems.length} size="small" />
                {section && !section.isActive && <Chip label="Section hidden" size="small" color="warning" variant="outlined" />}
              </Box>

              <Grid container spacing={2}>
                {secItems.map((item) => (
                  <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", opacity: item.isActive ? 1 : 0.55, transition: "opacity 0.2s" }}>
                      <Box sx={{ position: "relative", cursor: "pointer" }} onClick={() => setLightboxItem(item)}>
                        {item.mediaType === "video" ? (
                          <Box sx={{ width: "100%", bgcolor: "black", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            <Box component="video" src={getImageUrl(item.mediaUrl)} sx={{ width: "100%", display: "block" }} muted preload="metadata" />
                            <VideoIcon sx={{ position: "absolute", fontSize: 44, color: "white", opacity: 0.85, pointerEvents: "none" }} />
                          </Box>
                        ) : (
                          <Box component="img" src={getImageUrl(item.mediaUrl)} alt={item.title} sx={{ width: "100%", display: "block", objectFit: "contain" }} />
                        )}
                        {!item.isActive && (
                          <Box sx={{ position: "absolute", inset: 0, bgcolor: alpha("#000", 0.4), display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography variant="caption" color="white" fontWeight={700}>HIDDEN</Typography>
                          </Box>
                        )}
                      </Box>
                      <CardContent sx={{ flex: 1, pb: 0, pt: 1 }}>
                        <Chip label={item.mediaType} size="small" icon={item.mediaType === "video" ? <VideoIcon /> : <ImageIcon />} variant="outlined" sx={{ fontSize: "0.6rem", mb: 0.5 }} />
                        <Typography variant="subtitle2" noWrap fontWeight={600}>{item.title}</Typography>
                        {item.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {item.description}
                          </Typography>
                        )}
                      </CardContent>
                      {canEdit && (
                        <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                          <Tooltip title={item.isActive ? "Hide" : "Show"}>
                            <IconButton size="small" onClick={() => toggleItem.mutate(item.id)}>
                              {item.isActive ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDialog(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => { setDeletingItem(item); setDeleteItemDialogOpen(true); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      {/* ══ Section dialog ════════════════════════════════════════════════════ */}
      <Dialog open={sectionDialogOpen} onClose={closeSectionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSection ? "Edit Section" : "New Gallery Section"}</DialogTitle>
        <Box component="form" onSubmit={sHandleSubmit(onSectionSubmit)}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Controller name="name" control={sControl} rules={{ required: "Name is required" }}
              render={({ field }) => (
                <TextField {...field} label="Section Title" fullWidth error={!!sErrors.name} helperText={sErrors.name?.message ?? "Appears as a heading on the public gallery page"} />
              )}
            />
            <Controller name="description" control={sControl}
              render={({ field }) => <TextField {...field} label="Description (optional)" fullWidth multiline rows={2} helperText="Short subtitle shown below the section heading" />}
            />
            <Controller name="sortOrder" control={sControl}
              render={({ field }) => <TextField {...field} label="Sort Order" type="number" fullWidth inputProps={{ min: 0 }} helperText="Lower numbers appear first" />}
            />
            <Controller name="isActive" control={sControl}
              render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Visible on website" />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeSectionDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSectionSaving}>
              {isSectionSaving ? "Saving…" : editingSection ? "Save Changes" : "Create Section"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ══ Add-media dialog (multi-file) ═════════════════════════════════════ */}
      <Dialog open={addDialogOpen} onClose={closeAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Media to Gallery</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Drop zone */}
          <Box
            onDrop={handleAddDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => addFileInputRef.current?.click()}
            sx={{
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 2,
              minHeight: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              userSelect: "none",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            <UploadIcon sx={{ fontSize: 36, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Click or drag-and-drop to add images / videos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Images ≤ 1 MB &nbsp;|&nbsp; Videos ≤ 50 MB &nbsp;|&nbsp; Multiple files allowed
            </Typography>
          </Box>
          <input
            ref={addFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
            multiple
            hidden
            onChange={handleAddFileChange}
          />

          {/* Section selector */}
          <FormControl fullWidth>
            <InputLabel>Section (applies to all files)</InputLabel>
            <Select
              value={addCategoryId}
              onChange={(e) => setAddCategoryId(e.target.value)}
              label="Section (applies to all files)"
            >
              <MenuItem value=""><em>Uncategorised</em></MenuItem>
              {sections.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}{!s.isActive && <Typography component="span" variant="caption" color="text.secondary" ml={1}>(hidden)</Typography>}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Staged file list */}
          {stagedFiles.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">
                {stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} selected — edit titles below
              </Typography>
              <Stack gap={1.5}>
                {stagedFiles.map((staged, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 1.5, display: "flex", gap: 1.5, alignItems: "flex-start", opacity: staged.error ? 0.6 : 1 }}>
                    {/* Thumbnail */}
                    <Box sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: 1, overflow: "hidden", bgcolor: "action.hover", position: "relative" }}>
                      {staged.preview && staged.mediaType === "image" && (
                        <Box component="img" src={staged.preview} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      {staged.preview && staged.mediaType === "video" && (
                        <Box component="video" src={staged.preview} sx={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                      )}
                      {staged.mediaType === "video" && (
                        <VideoIcon sx={{ position: "absolute", inset: 0, m: "auto", fontSize: 28, color: "white", opacity: 0.8 }} />
                      )}
                    </Box>

                    {/* Title field + error */}
                    <Box flex={1}>
                      {staged.error ? (
                        <Typography variant="caption" color="error">{staged.file.name} — {staged.error}</Typography>
                      ) : (
                        <TextField
                          size="small"
                          fullWidth
                          label="Title"
                          value={staged.title}
                          onChange={(e) => updateStagedTitle(idx, e.target.value)}
                        />
                      )}
                      <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                        {staged.file.name} · {(staged.file.size / 1024).toFixed(0)} KB · {staged.mediaType}
                      </Typography>
                    </Box>

                    {/* Remove button */}
                    <IconButton size="small" onClick={() => removeStagedFile(idx)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeAddDialog} disabled={addUploading}>Cancel</Button>
          <Button
            variant="contained"
            disabled={addUploading || stagedFiles.filter((f) => !f.error).length === 0}
            onClick={onAddSubmit}
          >
            {addUploading
              ? "Uploading…"
              : `Upload ${stagedFiles.filter((f) => !f.error).length || ""} File${stagedFiles.filter((f) => !f.error).length !== 1 ? "s" : ""}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ Edit-media dialog (single item) ══════════════════════════════════ */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Media</DialogTitle>
        <Box component="form" onSubmit={eHandleSubmit(onEditSubmit)}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* File replace zone */}
            <Box>
              <Box
                role="button" tabIndex={0}
                onClick={() => editFileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); editFileInputRef.current?.click(); } }}
                sx={{ border: "2px dashed", borderColor: editFileError ? "error.main" : "divider", borderRadius: 2, minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", "&:hover": { borderColor: "primary.main" } }}
              >
                {editPreview ? (
                  editFile?.type.startsWith("video/") ? (
                    <Box component="video" src={editPreview} controls sx={{ maxHeight: 200, maxWidth: "100%", borderRadius: "6px" }} />
                  ) : (
                    <Box component="img" src={editPreview} alt="preview" sx={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", borderRadius: 1 }} />
                  )
                ) : editingItem?.mediaUrl ? (
                  editingItem.mediaType === "video" ? (
                    <Box component="video" src={getImageUrl(editingItem.mediaUrl)} controls sx={{ maxHeight: 200, maxWidth: "100%", borderRadius: "6px" }} />
                  ) : (
                    <Box component="img" src={getImageUrl(editingItem.mediaUrl)} alt="current" sx={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", borderRadius: 1 }} />
                  )
                ) : (
                  <><UploadIcon sx={{ fontSize: 36, color: "text.secondary" }} /><Typography variant="body2" color="text.secondary" mt={1}>Click to replace file</Typography></>
                )}
              </Box>
              {(editPreview || editingItem?.mediaUrl) && <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={0.5}>Click above to replace file</Typography>}
              {editFileError && <Typography variant="caption" color="error" display="block" mt={0.5}>{editFileError}</Typography>}
              <input ref={editFileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime" hidden onChange={handleEditFileChange} />
            </Box>

            <Controller name="title" control={eControl} rules={{ required: "Title is required" }}
              render={({ field }) => <TextField {...field} label="Title" fullWidth error={!!eErrors.title} helperText={eErrors.title?.message} />}
            />
            <Controller name="description" control={eControl}
              render={({ field }) => <TextField {...field} label="Description" fullWidth multiline rows={2} />}
            />
            <Controller name="categoryId" control={eControl}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select {...field} label="Section" value={field.value ?? ""}>
                    <MenuItem value=""><em>Uncategorised</em></MenuItem>
                    {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
            <Controller name="sortOrder" control={eControl}
              render={({ field }) => <TextField {...field} label="Sort Order" type="number" fullWidth inputProps={{ min: 0 }} />}
            />
            <Controller name="isActive" control={eControl}
              render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Visible on website" />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog} disabled={updateItem.isPending}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateItem.isPending}>
              {updateItem.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ══ Lightbox ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!lightboxItem} onClose={() => setLightboxItem(null)} maxWidth="md" fullWidth>
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
                <Box component="video" src={getImageUrl(lightboxItem.mediaUrl)} controls autoPlay sx={{ width: "100%", borderRadius: 2, maxHeight: "70vh" }} />
              ) : (
                <Box component="img" src={getImageUrl(lightboxItem.mediaUrl)} alt={lightboxItem.title} sx={{ width: "100%", objectFit: "contain", maxHeight: "70vh", borderRadius: 1 }} />
              )}
              {lightboxItem.description && <Typography variant="body2" color="text.secondary" mt={1}>{lightboxItem.description}</Typography>}
            </DialogContent>
            <DialogActions><Button onClick={() => setLightboxItem(null)}>Close</Button></DialogActions>
          </>
        )}
      </Dialog>

      {/* ══ Delete confirmations ══════════════════════════════════════════════ */}
      <ConfirmDialog
        open={deleteSectionDialogOpen}
        title="Delete Section"
        description={`Delete section "${deletingSection?.name}"? Media items will become uncategorised — not deleted.`}
        confirmLabel="Delete Section"
        loading={deleteSection.isPending}
        onConfirm={() => { if (deletingSection) deleteSection.mutate(deletingSection.id); setDeleteSectionDialogOpen(false); setDeletingSection(null); }}
        onCancel={() => { setDeleteSectionDialogOpen(false); setDeletingSection(null); }}
      />
      <ConfirmDialog
        open={deleteItemDialogOpen}
        title="Delete Media"
        description={`Delete "${deletingItem?.title}"? The media file will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleteItem.isPending}
        onConfirm={() => { if (deletingItem) deleteItem.mutate(deletingItem.id); setDeleteItemDialogOpen(false); setDeletingItem(null); }}
        onCancel={() => { setDeleteItemDialogOpen(false); setDeletingItem(null); }}
      />
    </Box>
  );
}
