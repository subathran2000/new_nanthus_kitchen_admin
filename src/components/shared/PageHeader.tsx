import { Box, Typography, type BoxProps } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps extends Omit<BoxProps, "title"> {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  sx,
  ...rest
}: PageHeaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
      mb={4}
      sx={sx}
      {...rest}
    >
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box display="flex" gap={1} alignItems="center">
          {actions}
        </Box>
      )}
    </Box>
  );
}
