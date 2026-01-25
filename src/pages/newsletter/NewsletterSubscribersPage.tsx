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
  Card,
  CardContent,
  Grid,
  alpha,
  InputAdornment,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { format, subDays, isAfter } from "date-fns";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { NewsletterSubscriber } from "../../types";

interface SubscriberForm {
  email: string;
}

interface BulkImportForm {
  emails: string;
}

export function NewsletterSubscribersPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<NewsletterSubscriber | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscriberForm>({
    defaultValues: {
      email: "",
    },
  });

  const {
    control: bulkControl,
    handleSubmit: handleBulkSubmit,
    reset: resetBulk,
    formState: { errors: bulkErrors },
  } = useForm<BulkImportForm>({
    defaultValues: {
      emails: "",
    },
  });

  // Fetch subscribers
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["newsletterSubscribers"],
    queryFn: async () => {
      const response = await api.get("/newsletter/subscribers");
      return response.data;
    },
  });

  const subscribers: NewsletterSubscriber[] = data?.data || [];

  // Stats calculations
  const totalSubscribers = subscribers.length;
  const thirtyDaysAgo = subDays(new Date(), 30);
  const newThisMonth = subscribers.filter(
    (s) => s.createdAt && isAfter(new Date(s.createdAt), thirtyDaysAgo),
  ).length;
  const sevenDaysAgo = subDays(new Date(), 7);
  const newThisWeek = subscribers.filter(
    (s) => s.createdAt && isAfter(new Date(s.createdAt), sevenDaysAgo),
  ).length;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SubscriberForm) => {
      return api.post("/newsletter/subscribers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
      toast.success("Subscriber added successfully");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add subscriber");
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const results = await Promise.allSettled(
        emails.map((email) => api.post("/newsletter/subscribers", { email })),
      );
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      return { successful, failed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
      if (data.failed > 0) {
        toast.success(
          `Added ${data.successful} subscribers. ${data.failed} failed (may already exist).`,
        );
      } else {
        toast.success(`Successfully added ${data.successful} subscribers`);
      }
      setBulkDialogOpen(false);
      resetBulk();
    },
    onError: () => {
      toast.error("Failed to import subscribers");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/newsletter/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
      toast.success("Subscriber deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete subscriber",
      );
    },
  });

  const handleOpenCreate = () => {
    reset({
      email: "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
  };

  const handleOpenDelete = (item: NewsletterSubscriber) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleExport = () => {
    const csvContent = [
      ["Email", "First Name", "Last Name", "Subscribed At"].join(","),
      ...subscribers.map((s) =>
        [
          s.email,
          s.firstName || "",
          s.lastName || "",
          s.createdAt ? format(new Date(s.createdAt), "yyyy-MM-dd") : "",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(
      new Date(),
      "yyyy-MM-dd",
    )}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Subscribers exported successfully");
  };

  const onSubmit = (data: SubscriberForm) => {
    createMutation.mutate(data);
  };

  const onBulkSubmit = (data: BulkImportForm) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const emails = data.emails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => emailRegex.test(e));

    if (emails.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }

    bulkImportMutation.mutate(emails);
  };

  const columns: GridColDef[] = [
    {
      field: "email",
      headerName: "Email Address",
      flex: 1,
      minWidth: 280,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Subscribed",
      width: 180,
      renderCell: (params) => {
        if (!params.value) return "-";
        const date = new Date(params.value);
        const isRecent = isAfter(date, sevenDaysAgo);
        return (
          <Box>
            <Typography variant="body2">
              {format(date, "MMM d, yyyy")}
            </Typography>
            {isRecent && (
              <Typography variant="caption" sx={{ color: "success.main" }}>
                New
              </Typography>
            )}
          </Box>
        );
      },
    },
    ...(canEdit
      ? [
          {
            field: "actions",
            type: "actions" as const,
            headerName: "Actions",
            width: 80,
            getActions: (params: any) => [
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Unsubscribe"
                onClick={() => handleOpenDelete(params.row)}
              />,
            ],
          },
        ]
      : []),
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
            Subscribers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your newsletter mailing list
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={subscribers.length === 0}
          >
            Export CSV
          </Button>
          {canEdit && (
            <>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setBulkDialogOpen(true)}
              >
                Bulk Import
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Add Subscriber
              </Button>
            </>
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
                <PeopleIcon sx={{ color: "#F7921E" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {totalSubscribers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Subscribers
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
                <TrendingUpIcon sx={{ color: "#4caf50" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {newThisMonth}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New This Month
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
                <CalendarIcon sx={{ color: "#2196f3" }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {newThisWeek}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New This Week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Grid */}
      <Paper sx={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={subscribers}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: "createdAt", sort: "desc" }] },
          }}
          disableRowSelectionOnClick
          slots={{
            toolbar: () => (
              <Box sx={{ p: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search by email..."
                  sx={{ width: 300 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            ),
          }}
        />
      </Paper>

      {/* Add Subscriber Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Add Subscriber</DialogTitle>
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
                    label="Email Address"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    placeholder="example@email.com"
                  />
                )}
              />
              <Alert severity="info">
                This subscriber will be added directly to your mailing list.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
            >
              Add Subscriber
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleBulkSubmit(onBulkSubmit)}>
          <DialogTitle>Bulk Import Subscribers</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Alert severity="info">
                Enter multiple email addresses, one per line or separated by
                commas.
              </Alert>
              <Controller
                name="emails"
                control={bulkControl}
                rules={{ required: "Please enter at least one email" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Addresses"
                    fullWidth
                    multiline
                    rows={8}
                    error={!!bulkErrors.emails}
                    helperText={
                      bulkErrors.emails?.message ||
                      "Example: john@email.com, jane@email.com"
                    }
                    placeholder={`john@example.com
jane@example.com
bob@example.com`}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={bulkImportMutation.isPending}
            >
              {bulkImportMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Subscriber</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove{" "}
            <strong>{deletingItem?.email}</strong> from your mailing list?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            They will no longer receive your newsletters.
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
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
