import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import InboxIcon from "@mui/icons-material/InboxOutlined";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 3,
        textAlign: "center",
        ...sx,
      }}
    >
      <Box sx={{ color: "text.secondary", mb: 2, fontSize: 48 }}>
        {icon || <InboxIcon sx={{ fontSize: 48 }} />}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, maxWidth: 360 }}
        >
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
