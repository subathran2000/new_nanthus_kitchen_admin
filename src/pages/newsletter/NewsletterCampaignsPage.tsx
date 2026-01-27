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
  Card,
  CardContent,
  Divider,
  Stack,
  alpha,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  Campaign as CampaignIcon,
  Celebration as CelebrationIcon,
  Restaurant as RestaurantIcon,
  Event as EventIcon,
  CardGiftcard as GiftIcon,
  Description as DescriptionIcon,
  ContentCopy as CopyIcon,
  Drafts as DraftsIcon,
  MarkEmailRead as SentIcon,
  Schedule as ScheduledIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "../../lib/api";
import { sanitizeHtml } from "../../lib/sanitize";
import { useAuth } from "../../contexts/AuthContext";
import type { NewsletterCampaign, NewsletterStatus } from "../../types";

interface CampaignForm {
  subject: string;
  content: string;
}

type TemplateId =
  | "blank"
  | "announcement"
  | "weekly-special"
  | "new-menu"
  | "event"
  | "holiday";

// Email templates with pre-written content
const EMAIL_TEMPLATES: {
  id: TemplateId;
  name: string;
  description: string;
  icon: React.ReactNode;
  subject: string;
  content: string;
}[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    icon: <DescriptionIcon />,
    subject: "",
    content: "",
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "General news and updates",
    icon: <CampaignIcon />,
    subject: "Important Update from Nanthu's Kitchen",
    content: `Dear valued customer,

We are excited to share some news with you!

[Your announcement content here]

Thank you for being part of the Nanthu's Kitchen family!

Warm regards,
Nanthu's Kitchen Team`,
  },
  {
    id: "weekly-special",
    name: "Weekly Special",
    description: "Highlight weekly specials",
    icon: <GiftIcon />,
    subject: "This Week's Special at Nanthu's Kitchen!",
    content: `Hello food lovers!

This week we're featuring something special just for you:

DISH NAME: [Special Dish Name]
PRICE: $XX.XX

[Description of the special dish - what makes it special, ingredients, etc.]

Available this week only! Don't miss out.

Visit us at:
- Markham: 72-30 Karachi Dr
- Scarborough: 80 Nashdene Rd

See you soon!
Nanthu's Kitchen Team`,
  },
  {
    id: "new-menu",
    name: "New Menu Items",
    description: "Announce new dishes",
    icon: <RestaurantIcon />,
    subject: "New on the Menu at Nanthu's Kitchen!",
    content: `Dear food enthusiasts,

We're thrilled to introduce our latest culinary creations!

NEW ADDITIONS:

1. [Dish Name 1] - $XX.XX
   [Brief description]

2. [Dish Name 2] - $XX.XX
   [Brief description]

3. [Dish Name 3] - $XX.XX
   [Brief description]

Come try these delicious new additions to our menu!

Best regards,
Nanthu's Kitchen Team`,
  },
  {
    id: "event",
    name: "Event Invitation",
    description: "Invite to special events",
    icon: <EventIcon />,
    subject: "You're Invited! Special Event at Nanthu's Kitchen",
    content: `You're Invited!

EVENT: [Event Name]
DATE: [Date]
TIME: [Time]
LOCATION: [Location]

[Event description and what guests can expect]

Limited spots available - reserve yours today!

RSVP: [Contact information or link]

We can't wait to see you there!

Nanthu's Kitchen Team`,
  },
  {
    id: "holiday",
    name: "Holiday Greeting",
    description: "Send holiday wishes",
    icon: <CelebrationIcon />,
    subject: "Happy Holidays from Nanthu's Kitchen!",
    content: `Happy Holidays!

From all of us at Nanthu's Kitchen, we want to express our heartfelt gratitude for your continued support throughout the year.

HOLIDAY HOURS:
[List your holiday operating hours]

[Any special holiday offerings or closures]

Wishing you and your loved ones a joyful holiday season filled with delicious food and wonderful memories!

With warmth and gratitude,
The Nanthu's Kitchen Family`,
  },
];

const statusConfig: Record<
  NewsletterStatus,
  {
    color: "default" | "info" | "warning" | "success" | "error";
    icon: React.ReactNode;
    label: string;
  }
> = {
  draft: {
    color: "default",
    icon: <DraftsIcon fontSize="small" />,
    label: "Draft",
  },
  scheduled: {
    color: "info",
    icon: <ScheduledIcon fontSize="small" />,
    label: "Scheduled",
  },
  sending: {
    color: "warning",
    icon: <SendIcon fontSize="small" />,
    label: "Sending",
  },
  sent: {
    color: "success",
    icon: <SentIcon fontSize="small" />,
    label: "Sent",
  },
  failed: {
    color: "error",
    icon: <DeleteIcon fontSize="small" />,
    label: "Failed",
  },
};

export function NewsletterCampaignsPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsletterCampaign | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<NewsletterCampaign | null>(
    null,
  );
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendingItem, setSendingItem] = useState<NewsletterCampaign | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<NewsletterCampaign | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("blank");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignForm>({
    defaultValues: {
      subject: "",
      content: "",
    },
  });

  const content = watch("content");
  const subject = watch("subject");

  // Fetch campaigns
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["newsletterCampaigns"],
    queryFn: async () => {
      const response = await api.get("/newsletter/campaigns");
      return response.data;
    },
  });

  const campaigns: NewsletterCampaign[] = data?.data || [];

  // Stats
  const draftCount = campaigns.filter((c) => c.status === "draft").length;
  const sentCount = campaigns.filter((c) => c.status === "sent").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CampaignForm) => {
      // Convert plain text to simple HTML
      const htmlContent = convertTextToHtml(data.content);
      return api.post("/newsletter/campaigns", {
        ...data,
        content: htmlContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
      toast.success("Campaign created successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create campaign");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CampaignForm }) => {
      const htmlContent = convertTextToHtml(data.content);
      return api.patch(`/newsletter/campaigns/${id}`, {
        ...data,
        content: htmlContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
      toast.success("Campaign updated successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update campaign");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/newsletter/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
      toast.success("Campaign deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/newsletter/campaigns/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
      toast.success("Campaign is being sent to all subscribers!");
      setSendDialogOpen(false);
      setSendingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send campaign");
    },
  });

  // Convert plain text to HTML for email
  const convertTextToHtml = (text: string): string => {
    if (!text) return "";

    const brandColor = "#F7921E";
    const lines = text.split("\n");
    let html = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        html += "<br/>";
        continue;
      }

      // Detect headers (all caps or lines ending with :)
      if (
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 3 &&
        !trimmed.includes("$")
      ) {
        html += `<h2 style="color: ${brandColor}; margin: 20px 0 10px 0; font-size: 18px;">${trimmed}</h2>`;
      } else if (trimmed.endsWith(":") && trimmed.length < 50) {
        html += `<p style="color: ${brandColor}; font-weight: bold; margin: 15px 0 5px 0;">${trimmed}</p>`;
      } else if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
        html += `<p style="margin: 5px 0 5px 20px;">${trimmed}</p>`;
      } else if (/^\d+\./.test(trimmed)) {
        html += `<p style="margin: 5px 0 5px 20px;">${trimmed}</p>`;
      } else {
        html += `<p style="margin: 10px 0; line-height: 1.6;">${trimmed}</p>`;
      }
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid ${brandColor}; margin-bottom: 20px;">
          <h1 style="color: ${brandColor}; margin: 0;">Nanthu's Kitchen</h1>
        </div>
        ${html}
        <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Nanthu's Kitchen</p>
          <p>Markham: 72-30 Karachi Dr | Scarborough: 80 Nashdene Rd</p>
        </div>
      </div>
    `;
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedTemplate("blank");
    reset({ subject: "", content: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: NewsletterCampaign) => {
    if (item.status !== "draft") {
      toast.error("Only draft campaigns can be edited");
      return;
    }
    setEditingItem(item);
    setSelectedTemplate("blank");
    // Convert HTML back to plain text for editing
    const plainText = htmlToText(item.content);
    reset({ subject: item.subject, content: plainText });
    setDialogOpen(true);
  };

  const htmlToText = (html: string): string => {
    if (!html) return "";
    // Simple HTML to text conversion
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setSelectedTemplate("blank");
    reset();
  };

  const handleTemplateSelect = (templateId: TemplateId) => {
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setValue("subject", template.subject);
      setValue("content", template.content);
    }
  };

  const handleDuplicate = (item: NewsletterCampaign) => {
    setEditingItem(null);
    setSelectedTemplate("blank");
    const plainText = htmlToText(item.content);
    reset({ subject: `Copy of ${item.subject}`, content: plainText });
    setDialogOpen(true);
    toast.success("Campaign duplicated - make changes and save");
  };

  const handleOpenDelete = (item: NewsletterCampaign) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleOpenSend = (item: NewsletterCampaign) => {
    if (item.status !== "draft") {
      toast.error("Only draft campaigns can be sent");
      return;
    }
    setSendingItem(item);
    setSendDialogOpen(true);
  };

  const handleOpenView = (item: NewsletterCampaign) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  const onSubmit = (data: CampaignForm) => {
    if (!data.subject.trim()) {
      toast.error("Please enter a subject line");
      return;
    }
    if (!data.content.trim()) {
      toast.error("Please enter email content");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "subject",
      headerName: "Campaign",
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Created {format(new Date(params.row.createdAt), "MMM d, yyyy")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => {
        const config = statusConfig[params.value as NewsletterStatus];
        return (
          <Chip
            icon={config.icon as React.ReactElement}
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "sentCount",
      headerName: "Sent To",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.status === "sent" ? params.value || 0 : "-"}
        </Typography>
      ),
    },
    {
      field: "sentAt",
      headerName: "Sent Date",
      width: 140,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "MMM d, yyyy h:mm a") : "-",
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 180,
      getActions: (params: any) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<ViewIcon />}
            label="Preview"
            onClick={() => handleOpenView(params.row)}
          />,
          <GridActionsCellItem
            key="duplicate"
            icon={<CopyIcon />}
            label="Duplicate"
            onClick={() => handleDuplicate(params.row)}
          />,
        ];

        if (canEdit && params.row.status === "draft") {
          actions.unshift(
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleOpenEdit(params.row)}
            />,
            <GridActionsCellItem
              key="send"
              icon={<SendIcon />}
              label="Send"
              onClick={() => handleOpenSend(params.row)}
            />,
          );
        }

        if (canEdit) {
          actions.push(
            <GridActionsCellItem
              key="delete"
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => handleOpenDelete(params.row)}
            />,
          );
        }

        return actions;
      },
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Email Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and send newsletters to your subscribers
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
              New Campaign
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha("#F7921E", 0.1) }}
              >
                <DraftsIcon sx={{ color: "#F7921E" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {draftCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drafts
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha("#4caf50", 0.1) }}
              >
                <SentIcon sx={{ color: "#4caf50" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {sentCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Campaigns Sent
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha("#2196f3", 0.1) }}
              >
                <SendIcon sx={{ color: "#2196f3" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {totalSent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Emails Delivered
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Grid */}
      <Paper sx={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={campaigns}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: "createdAt", sort: "desc" }] },
          }}
          disableRowSelectionOnClick
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
          onRowDoubleClick={(params) => handleOpenView(params.row)}
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
            {editingItem ? "Edit Campaign" : "Create New Campaign"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Template Selector - only for new campaigns */}
              {!editingItem && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Start with a template (optional)
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedTemplate}
                      onChange={(e) =>
                        handleTemplateSelect(e.target.value as TemplateId)
                      }
                    >
                      {EMAIL_TEMPLATES.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {template.icon}
                            <Box>
                              <Typography variant="body2">
                                {template.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {template.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Subject Line */}
              <Controller
                name="subject"
                control={control}
                rules={{ required: "Subject line is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Subject Line"
                    fullWidth
                    error={!!errors.subject}
                    helperText={
                      errors.subject?.message ||
                      "This appears in the recipient's inbox"
                    }
                    placeholder="e.g., This Week's Special at Nanthu's Kitchen"
                  />
                )}
              />

              {/* Email Content */}
              <Controller
                name="content"
                control={control}
                rules={{ required: "Email content is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Content"
                    fullWidth
                    multiline
                    rows={12}
                    error={!!errors.content}
                    helperText={
                      errors.content?.message ||
                      "Write your message in plain text. Headers and formatting will be applied automatically."
                    }
                    placeholder={`Dear valued customer,

We're excited to share...

[Your message here]

Best regards,
Nanthu's Kitchen Team`}
                  />
                )}
              />

              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Formatting tips:</strong>
                  <br />• ALL CAPS text becomes section headers
                  <br />• Lines ending with : become bold labels
                  <br />• Lines starting with - or numbers become lists
                  <br />• The restaurant logo and footer are added automatically
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? "Update Draft" : "Save as Draft"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6">{viewingItem?.subject}</Typography>
            <Typography variant="caption" color="text.secondary">
              {viewingItem?.status === "sent" && viewingItem?.sentAt
                ? `Sent on ${format(new Date(viewingItem.sentAt), "MMMM d, yyyy 'at' h:mm a")} to ${viewingItem.sentCount} subscribers`
                : `Status: ${statusConfig[viewingItem?.status as NewsletterStatus]?.label || "Unknown"}`}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper
            variant="outlined"
            sx={{
              p: 0,
              mt: 2,
              maxHeight: 500,
              overflow: "auto",
              bgcolor: "#f5f5f5",
            }}
          >
            <Box
              sx={{ bgcolor: "white", p: 2 }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(viewingItem?.content) || "<p>No content</p>",
              }}
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {canEdit && viewingItem?.status === "draft" && (
            <>
              <Button
                onClick={() => {
                  setViewDialogOpen(false);
                  handleOpenEdit(viewingItem);
                }}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setViewDialogOpen(false);
                  handleOpenSend(viewingItem);
                }}
              >
                Send Now
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Campaign</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to send{" "}
            <strong>"{sendingItem?.subject}"</strong> to all newsletter
            subscribers?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The email will be sent to all active subscribers immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button
            color="primary"
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => sendingItem && sendMutation.mutate(sendingItem.id)}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? "Sending..." : "Send Now"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Campaign</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>"{deletingItem?.subject}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
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
