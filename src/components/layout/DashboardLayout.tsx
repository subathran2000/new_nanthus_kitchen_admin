import { useState, useEffect, memo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Collapse,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  Event as EventIcon,
  LocalOffer as SpecialsIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  Fastfood as FoodIcon,
  Straighten as MeasureIcon,
  Campaign as CampaignIcon,
  Subscriptions as SubscribersIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminLocation } from "@/contexts/LocationContext";
import { formatCurrentDateTimeInToronto } from "@/lib/timezone";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useThemeModeContext } from "@/App";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";

const DRAWER_WIDTH = 280;

interface NavItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    title: "Menu Management",
    icon: <RestaurantIcon />,
    children: [
      {
        title: "Primary Categories",
        path: "/menu/primary-categories",
        icon: <CategoryIcon />,
      },
      { title: "Categories", path: "/menu/categories", icon: <CategoryIcon /> },
      { title: "Menu Items", path: "/menu/items", icon: <FoodIcon /> },
      {
        title: "Measurements",
        path: "/menu/measurement-types",
        icon: <MeasureIcon />,
      },
    ],
  },
  {
    title: "Events",
    path: "/events",
    icon: <EventIcon />,
  },
  {
    title: "Specials",
    path: "/specials",
    icon: <SpecialsIcon />,
  },
  {
    title: "Opening Hours",
    path: "/opening-hours",
    icon: <ScheduleIcon />,
  },
  {
    title: "Newsletter",
    icon: <EmailIcon />,
    children: [
      {
        title: "Subscribers",
        path: "/newsletter/subscribers",
        icon: <SubscribersIcon />,
      },
      {
        title: "Campaigns",
        path: "/newsletter/campaigns",
        icon: <CampaignIcon />,
      },
    ],
  },
  {
    title: "Users",
    path: "/users",
    icon: <PeopleIcon />,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <SettingsIcon />,
  },
];

const Clock = memo(function Clock() {
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => setCurrentTime(formatCurrentDateTimeInToronto());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ color: "primary.main", minWidth: 75 }}
      title="America/Toronto timezone"
    >
      {currentTime}
    </Typography>
  );
});

export function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Menu Management",
    "Newsletter",
  ]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeModeContext();
  const navigate = useNavigate();
  const location = useLocation();

  const { location: adminLocation, setLocation: setAdminLocation } = useAdminLocation();

  // Initialize WebSocket connection for real-time updates
  useWebSocket();

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => {
    // Visitors can see everything except Users management
    if (user?.role === "visitor") {
      return item.title !== "Users";
    }
    // super_admin, admin, and manager can manage users (backend enforces scope)
    return true;
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      setExpandedItems((prev) =>
        prev.includes(item.title)
          ? prev.filter((i) => i !== item.title)
          : [...prev, item.title],
      );
    } else if (item.path) {
      navigate(item.path);
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isParentActive = (item: NavItem) => {
    if (item.path) return isActive(item.path);
    return item.children?.some((child) => isActive(child.path)) ?? false;
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo - Compact Design */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
          }}
        >
          <Box
            component="img"
            src="/new_nanthus_kitchen_logo.png"
            alt="Nanthu's Kitchen"
            sx={{
              width: 48,
              height: 48,
              objectFit: "contain",
              opacity: 0.9,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                lineHeight: 1.2,
                fontSize: "0.85rem",
              }}
            >
              Nanthu's Kitchen
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                letterSpacing: 1,
                textTransform: "uppercase",
                fontSize: "0.65rem",
                fontWeight: 500,
                opacity: 0.7,
              }}
            >
              Admin Panel
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {filteredNavItems.map((item) => (
          <Box key={item.title}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavClick(item)}
                selected={isParentActive(item)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                    "& .MuiListItemIcon-root": {
                      color: "primary.main",
                    },
                    "& .MuiListItemText-primary": {
                      color: "primary.main",
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
                {item.children &&
                  (expandedItems.includes(item.title) ? (
                    <ExpandLess />
                  ) : (
                    <ExpandMore />
                  ))}
              </ListItemButton>
            </ListItem>
            {item.children && (
              <Collapse
                in={expandedItems.includes(item.title)}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding sx={{ pl: 2 }}>
                  {item.children.map((child) => (
                    <ListItem key={child.title} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavClick(child)}
                        selected={isActive(child.path)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          "&.Mui-selected": {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            "& .MuiListItemIcon-root": {
                              color: "primary.main",
                            },
                            "& .MuiListItemText-primary": {
                              color: "primary.main",
                              fontWeight: 600,
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText primary={child.title} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>

      {/* User Info */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role?.split("_").join(" ").toUpperCase()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "background.paper",
          color: "text.primary",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Toggle navigation menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <ToggleButtonGroup
            value={adminLocation}
            exclusive
            onChange={(_, val) => val && setAdminLocation(val)}
            size="small"
            sx={{ mr: 1.5 }}
          >
            <ToggleButton value="scarborough" sx={{ px: 1.5, fontSize: "0.75rem" }}>
              <StorefrontIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Scarborough
            </ToggleButton>
            <ToggleButton value="markham" sx={{ px: 1.5, fontSize: "0.75rem" }}>
              <StorefrontIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Markham
            </ToggleButton>
          </ToggleButtonGroup>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mr: 2,
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <AccessTimeIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Clock />
          </Box>
          <ThemeToggle mode={mode} onToggle={toggleMode} />
          <IconButton onClick={handleMenuClick} aria-label="User menu">
            <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate("/settings");
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
