import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  alpha,
} from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Event as EventIcon,
  LocalOffer as SpecialsIcon,
  Email as EmailIcon,
  Category as CategoryIcon,
  Fastfood as FoodIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import api from "@/lib/api";
import { StatCard } from "@/components/shared";
import { PageHeader } from "@/components/shared";
import { statColors } from "@/theme/tokens";

export function DashboardPage() {
  const { data: menuStats, isLoading: menuLoading } = useQuery({
    queryKey: ["menu-statistics"],
    queryFn: async () => {
      const response = await api.get("/menu/items/statistics");
      return response.data;
    },
  });

  const { data: categoryStats, isLoading: categoryLoading } = useQuery({
    queryKey: ["category-statistics"],
    queryFn: async () => {
      const response = await api.get("/menu/categories/statistics");
      return response.data;
    },
  });

  const { data: eventStats, isLoading: eventsLoading } = useQuery({
    queryKey: ["events-statistics"],
    queryFn: async () => {
      const response = await api.get("/events/statistics");
      return response.data;
    },
  });

  const { data: specialStats, isLoading: specialsLoading } = useQuery({
    queryKey: ["specials-statistics"],
    queryFn: async () => {
      const response = await api.get("/specials/statistics");
      return response.data;
    },
  });

  const { data: subscriberStats, isLoading: subscribersLoading } = useQuery({
    queryKey: ["subscriber-statistics"],
    queryFn: async () => {
      const response = await api.get("/newsletter/subscribers/statistics");
      return response.data;
    },
  });

  // Calculate totals for overview
  const totalActive =
    (menuStats?.active || 0) +
    (eventStats?.active || 0) +
    (specialStats?.active || 0);

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of what's happening at New Nanthus Kitchen today."
        sx={{ mb: 4 }}
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          {menuLoading ? (
            <Skeleton
              variant="rectangular"
              height={160}
              sx={{ borderRadius: 3 }}
            />
          ) : (
            <StatCard
              title="Total Menu Items"
              value={menuStats?.total || 0}
              icon={<RestaurantIcon fontSize="large" />}
              color={statColors.orange}
              subtitle={`${menuStats?.active || 0} active currently`}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          {eventsLoading ? (
            <Skeleton
              variant="rectangular"
              height={160}
              sx={{ borderRadius: 3 }}
            />
          ) : (
            <StatCard
              title="Active Events"
              value={eventStats?.active || 0}
              icon={<EventIcon fontSize="large" />}
              color={statColors.blue}
              subtitle={`${eventStats?.upcoming || 0} upcoming`}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          {specialsLoading ? (
            <Skeleton
              variant="rectangular"
              height={160}
              sx={{ borderRadius: 3 }}
            />
          ) : (
            <StatCard
              title="Current Specials"
              value={specialStats?.total || 0}
              icon={<SpecialsIcon fontSize="large" />}
              color={statColors.green}
              subtitle={`${specialStats?.active || 0} active now`}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          {subscribersLoading ? (
            <Skeleton
              variant="rectangular"
              height={160}
              sx={{ borderRadius: 3 }}
            />
          ) : (
            <StatCard
              title="Total Subscribers"
              value={subscriberStats?.active || 0}
              icon={<EmailIcon fontSize="large" />}
              color={statColors.amber}
              subtitle={`${subscriberStats?.verified || 0} verified users`}
            />
          )}
        </Grid>
      </Grid>

      {/* Content Overview & Quick Actions */}
      <Grid container spacing={4}>
        {/* Content Breakdown */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: "100%", p: 2 }}>
            <CardContent>
              <Box
                sx={{
                  mb: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Content Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time statistics from your restaurant data
                  </Typography>
                </div>
                <Chip
                  label={`${totalActive} Active Items`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>

              <List sx={{ py: 0 }}>
                {/* Menu Items */}
                <ListItem sx={{ px: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha(statColors.orange, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                    }}
                  >
                    <FoodIcon sx={{ color: statColors.orange }} />
                  </Box>
                  <ListItemText
                    primary="Menu Items"
                    secondary={`${menuStats?.active || 0} active of ${menuStats?.total || 0} total`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Box sx={{ width: 120 }}>
                    {menuLoading ? (
                      <Skeleton />
                    ) : (
                      <LinearProgress
                        variant="determinate"
                        value={
                          menuStats?.total
                            ? (menuStats.active / menuStats.total) * 100
                            : 0
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(statColors.orange, 0.1),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: statColors.orange,
                          },
                        }}
                      />
                    )}
                  </Box>
                </ListItem>

                {/* Categories */}
                <ListItem sx={{ px: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha(statColors.purple, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                    }}
                  >
                    <CategoryIcon sx={{ color: statColors.purple }} />
                  </Box>
                  <ListItemText
                    primary="Menu Categories"
                    secondary={`${categoryStats?.active || 0} active of ${categoryStats?.total || 0} total`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Box sx={{ width: 120 }}>
                    {categoryLoading ? (
                      <Skeleton />
                    ) : (
                      <LinearProgress
                        variant="determinate"
                        value={
                          categoryStats?.total
                            ? (categoryStats.active / categoryStats.total) * 100
                            : 0
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(statColors.purple, 0.1),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: statColors.purple,
                          },
                        }}
                      />
                    )}
                  </Box>
                </ListItem>

                {/* Events */}
                <ListItem sx={{ px: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha(statColors.blue, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                    }}
                  >
                    <EventIcon sx={{ color: statColors.blue }} />
                  </Box>
                  <ListItemText
                    primary="Events"
                    secondary={`${eventStats?.active || 0} active, ${eventStats?.upcoming || 0} upcoming`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Box sx={{ width: 120 }}>
                    {eventsLoading ? (
                      <Skeleton />
                    ) : (
                      <LinearProgress
                        variant="determinate"
                        value={
                          eventStats?.total
                            ? (eventStats.active / eventStats.total) * 100
                            : 0
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(statColors.blue, 0.1),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: statColors.blue,
                          },
                        }}
                      />
                    )}
                  </Box>
                </ListItem>

                {/* Specials */}
                <ListItem sx={{ px: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha(statColors.green, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                    }}
                  >
                    <SpecialsIcon sx={{ color: statColors.green }} />
                  </Box>
                  <ListItemText
                    primary="Specials"
                    secondary={`${specialStats?.active || 0} active of ${specialStats?.total || 0} total`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Box sx={{ width: 120 }}>
                    {specialsLoading ? (
                      <Skeleton />
                    ) : (
                      <LinearProgress
                        variant="determinate"
                        value={
                          specialStats?.total
                            ? (specialStats.active / specialStats.total) * 100
                            : 0
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(statColors.green, 0.1),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: statColors.green,
                          },
                        }}
                      />
                    )}
                  </Box>
                </ListItem>

                {/* Newsletter Subscribers */}
                <ListItem sx={{ px: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha(statColors.amber, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                    }}
                  >
                    <EmailIcon sx={{ color: statColors.amber }} />
                  </Box>
                  <ListItemText
                    primary="Newsletter Subscribers"
                    secondary={`${subscriberStats?.verified || 0} verified of ${subscriberStats?.active || 0} total`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Box sx={{ width: 120 }}>
                    {subscribersLoading ? (
                      <Skeleton />
                    ) : (
                      <LinearProgress
                        variant="determinate"
                        value={
                          subscriberStats?.active
                            ? (subscriberStats.verified /
                                subscriberStats.active) *
                              100
                            : 0
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(statColors.amber, 0.1),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: statColors.amber,
                          },
                        }}
                      />
                    )}
                  </Box>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%", p: 2 }}>
            <CardContent>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Frequently used management tools
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <QuickActionItem
                  icon={<RestaurantIcon fontSize="medium" />}
                  title="Add New Dish"
                  description="Create a new menu item"
                  href="/menu/items"
                />
                <QuickActionItem
                  icon={<EventIcon fontSize="medium" />}
                  title="Create Event"
                  description="Schedule a new event"
                  href="/events"
                />
                <QuickActionItem
                  icon={<SpecialsIcon fontSize="medium" />}
                  title="Add Special"
                  description="Launch a new promotion"
                  href="/specials"
                />
                <QuickActionItem
                  icon={<EmailIcon fontSize="medium" />}
                  title="Send Newsletter"
                  description="Reach out to subscribers"
                  href="/newsletter/campaigns"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

interface QuickActionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function QuickActionItem({
  icon,
  title,
  description,
  href,
}: QuickActionItemProps) {
  return (
    <Box
      component={Link}
      to={href}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: "action.hover",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: "primary.main",
          color: "white",
          "& .MuiSvgIcon-root": {
            color: "white",
          },
        },
      }}
    >
      <Box sx={{ color: "primary.main" }}>{icon}</Box>
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: "inherit", opacity: 0.7 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}
