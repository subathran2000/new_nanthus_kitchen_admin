import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  FormControlLabel,
  Switch,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { parse, format } from "date-fns";
import api from "../../lib/api";
import { formatCurrentDateTimeInToronto } from "../../lib/timezone";
import { useAuth } from "../../contexts/AuthContext";
import type { OpeningHours, DayOfWeek, Location } from "../../types";

interface DayHours {
  dayOfWeek: DayOfWeek;
  isClosed: boolean;
  openTime: Date | null;
  closeTime: Date | null;
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

const parseTimeString = (time: string | null): Date | null => {
  if (!time) return null;
  try {
    // Try HH:mm format first (backend standard)
    if (time.length === 5) {
      return parse(time, "HH:mm", new Date());
    }
    // Fallback to HH:mm:ss for backward compatibility
    return parse(time, "HH:mm:ss", new Date());
  } catch {
    return null;
  }
};

const formatTimeToString = (date: Date | null): string | null => {
  if (!date) return null;
  return format(date, "HH:mm");
};

export function OpeningHoursPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState<Location>("markham");
  const [hours, setHours] = useState<DayHours[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Update Toronto time clock every second
  useEffect(() => {
    const updateTime = () => setCurrentTime(formatCurrentDateTimeInToronto());
    updateTime(); // Initial update
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch opening hours for specific location (server-side filtering)
  const {
    data: openingHoursData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["openingHours", tabValue],
    queryFn: async () => {
      const response = await api.get(`/opening-hours/location/${tabValue}`);
      return response.data;
    },
  });

  // Fetch current open status (relies on WebSocket for real-time updates)
  const { data: statusData } = useQuery({
    queryKey: ["openingStatus", tabValue],
    queryFn: async () => {
      const response = await api.get(`/opening-hours/status/${tabValue}`);
      return response.data;
    },
    staleTime: 60000, // Cache status for 1 minute
  });

  // Backend returns array directly
  const locationHours: OpeningHours[] = Array.isArray(openingHoursData)
    ? openingHoursData
    : [];

  // Initialize hours state when data loads OR when switching locations
  useEffect(() => {
    if (!openingHoursData) return;

    const hoursMap = new Map(locationHours.map((h) => [h.dayOfWeek, h]));
    const newHours = daysOfWeek.map((day) => {
      const existing = hoursMap.get(day.value);
      return {
        dayOfWeek: day.value,
        isClosed: existing?.isClosed ?? false,
        openTime: parseTimeString(existing?.openTime || null),
        closeTime: parseTimeString(existing?.closeTime || null),
      };
    });
    setHours(newHours);
    setHasChanges(false);
  }, [openingHoursData, tabValue]);

  // Bulk update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { items: any[] }) => {
      return api.patch("/opening-hours/bulk", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["openingHours"] });
      await queryClient.invalidateQueries({ queryKey: ["openingStatus"] });
      await refetch(); // Explicitly refetch to ensure fresh data
      toast.success("Opening hours saved successfully");
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to save opening hours",
      );
    },
  });

  // Initialize mutation
  const initializeMutation = useMutation({
    mutationFn: async (location: Location) => {
      return api.post(`/opening-hours/initialize/${location}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openingHours"] });
      toast.success("Opening hours initialized with default values");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to initialize opening hours",
      );
    },
  });

  const handleHourChange = (
    dayIndex: number,
    field: keyof DayHours,
    value: any,
  ) => {
    const newHours = [...hours];
    newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };
    setHours(newHours);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Check if we have existing records or need to create new ones
    if (locationHours.length === 0) {
      // No existing records - create new ones
      try {
        const createPromises = hours.map((h) => {
          const payload: any = {
            dayOfWeek: h.dayOfWeek,
            location: tabValue,
            isClosed: h.isClosed,
          };

          // Only include time fields if not closed and times are set
          if (!h.isClosed) {
            if (h.openTime) {
              payload.openTime = formatTimeToString(h.openTime);
            }
            if (h.closeTime) {
              payload.closeTime = formatTimeToString(h.closeTime);
            }
          }

          return api.post("/opening-hours", payload);
        });

        await Promise.all(createPromises);
        await queryClient.invalidateQueries({ queryKey: ["openingHours"] });
        await queryClient.invalidateQueries({ queryKey: ["openingStatus"] });
        await refetch(); // Explicitly refetch to ensure fresh data
        toast.success("Opening hours created successfully");
        setHasChanges(false);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to create opening hours",
        );
      }
    } else {
      // Update existing records
      const items = hours
        .map((h) => {
          const existing = locationHours.find(
            (lh) => lh.dayOfWeek === h.dayOfWeek,
          );

          if (!existing) {
            return null;
          }

          const item: any = {
            id: existing.id,
            isClosed: h.isClosed,
          };

          // Only include time fields if not closed and times are set
          if (!h.isClosed) {
            if (h.openTime) {
              item.openTime = formatTimeToString(h.openTime);
            }
            if (h.closeTime) {
              item.closeTime = formatTimeToString(h.closeTime);
            }
          }

          return item;
        })
        .filter(Boolean);

      if (items.length === 0) {
        toast.error("No valid records to update");
        return;
      }

      updateMutation.mutate({ items });
    }
  };

  const handleLocationChange = (_: any, newValue: Location) => {
    if (hasChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to switch locations?",
        )
      ) {
        return;
      }
    }
    setTabValue(newValue);
  };

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
              Opening Hours
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage opening hours for both locations
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => refetch()} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
              >
                Save Changes
              </Button>
            )}
          </Box>
        </Box>

        {/* Location Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleLocationChange}>
            <Tab label="Markham" value="markham" />
            <Tab label="Scarborough" value="scarborough" />
          </Tabs>
        </Paper>

        {/* No records info */}
        {locationHours.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              No opening hours configured yet for{" "}
              {tabValue === "markham" ? "Markham" : "Scarborough"}.
              {canEdit &&
                " Set the hours below and click 'Save Changes' to create them."}
            </Typography>
          </Alert>
        )}

        {/* Status Alert */}
        {statusData && (
          <Alert
            severity={statusData.isOpen ? "success" : "info"}
            sx={{ mb: 3 }}
            icon={statusData.isOpen ? undefined : false}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="body2">
                  <strong>
                    {tabValue === "markham" ? "Markham" : "Scarborough"}
                  </strong>{" "}
                  is currently{" "}
                  <strong
                    style={{
                      color: statusData.isOpen ? "#2e7d32" : "#ed6c02",
                    }}
                  >
                    {statusData.isOpen ? "OPEN" : "CLOSED"}
                  </strong>
                </Typography>
                {statusData.message && (
                  <Typography variant="caption" color="text.secondary">
                    {statusData.message}
                  </Typography>
                )}
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-end"
                gap={0.5}
              >
                <Chip
                  label={currentTime}
                  size="small"
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 600,
                    fontFamily: "monospace",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem" }}
                >
                  America/Toronto
                </Typography>
              </Box>
            </Box>
          </Alert>
        )}

        {hasChanges && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You have unsaved changes. Click "Save Changes" to apply them.
          </Alert>
        )}

        {/* Hours Grid */}
        <Grid container spacing={2}>
          {hours.map((dayHours, index) => {
            const dayInfo = daysOfWeek.find(
              (d) => d.value === dayHours.dayOfWeek,
            );
            return (
              <Grid size={{ xs: 12, md: 6 }} key={dayHours.dayOfWeek}>
                <Card variant="outlined">
                  <CardHeader
                    title={dayInfo?.label}
                    titleTypographyProps={{ variant: "h6" }}
                    action={
                      <Chip
                        label={dayHours.isClosed ? "Closed" : "Open"}
                        color={dayHours.isClosed ? "default" : "success"}
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={dayHours.isClosed}
                            onChange={(e) =>
                              handleHourChange(
                                index,
                                "isClosed",
                                e.target.checked,
                              )
                            }
                            disabled={!canEdit}
                          />
                        }
                        label="Closed"
                      />

                      {!dayHours.isClosed && (
                        <>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                              <TimePicker
                                label="Open Time"
                                value={dayHours.openTime}
                                onChange={(value) =>
                                  handleHourChange(index, "openTime", value)
                                }
                                disabled={!canEdit}
                                slotProps={{
                                  textField: { fullWidth: true, size: "small" },
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <TimePicker
                                label="Close Time"
                                value={dayHours.closeTime}
                                onChange={(value) =>
                                  handleHourChange(index, "closeTime", value)
                                }
                                disabled={!canEdit}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    size: "small",
                                    helperText:
                                      "Can be next day for overnight hours",
                                  },
                                }}
                              />
                            </Grid>
                          </Grid>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Location Info */}
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Location Details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Markham
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    72-30 Karachi Dr, Markham, ON L3S 0B6
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Scarborough
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    80 Nashdene Rd, Scarborough, ON M1V 5E4
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
