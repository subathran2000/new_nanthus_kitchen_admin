import { Chip, type ChipProps } from "@mui/material";

type StatusMap = Record<string, { label: string; color: ChipProps["color"] }>;

interface StatusChipProps extends Omit<ChipProps, "label" | "color"> {
  status: string;
  statusMap: StatusMap;
}

export function StatusChip({
  status,
  statusMap,
  ...chipProps
}: StatusChipProps) {
  const mapped = statusMap[status] ?? {
    label: status,
    color: "default" as const,
  };
  return (
    <Chip
      label={mapped.label}
      color={mapped.color}
      size="small"
      {...chipProps}
    />
  );
}
