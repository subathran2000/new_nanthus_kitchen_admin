import { useRef, type ReactNode } from "react";
import { Box, Typography, IconButton, Avatar } from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";

interface ImageUploadProps {
  maxSizeBytes?: number;
  existingImages: string[];
  newPreviews: string[];
  onAddFiles: (files: File[], previews: string[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
  getImageUrl: (path: string) => string;
  multiple?: boolean;
  label?: ReactNode;
}

export function ImageUpload({
  maxSizeBytes = 1 * 1024 * 1024,
  existingImages,
  newPreviews,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
  getImageUrl,
  multiple = true,
  label,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const previews: string[] = [];
    let processedCount = 0;

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        toast.error(`"${file.name}" exceeds ${maxSizeMB}MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        processedCount++;
        if (processedCount === validFiles.length) {
          onAddFiles(validFiles, previews);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const allImages = [
    ...existingImages.map((img) => ({
      src: getImageUrl(img),
      isExisting: true,
    })),
    ...newPreviews.map((src) => ({ src, isExisting: false })),
  ];

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {label}
      <Box
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        sx={{
          width: "100%",
          minHeight: 120,
          border: "2px dashed",
          borderColor: "divider",
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          p: 2,
          "&:hover, &:focus-visible": {
            borderColor: "primary.main",
            outline: "none",
          },
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <UploadIcon sx={{ fontSize: 32, color: "text.secondary" }} />
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Click to upload images
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Max {maxSizeMB}MB per image
        </Typography>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={handleChange}
      />

      {allImages.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={1}>
          {allImages.map((img, index) => {
            const isExisting = index < existingImages.length;
            return (
              <Box key={index} position="relative">
                <Avatar
                  src={img.src}
                  variant="rounded"
                  sx={{ width: 60, height: 60 }}
                />
                <IconButton
                  size="small"
                  aria-label="Remove image"
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    bgcolor: "error.main",
                    color: "white",
                    "&:hover": { bgcolor: "error.dark" },
                    width: 20,
                    height: 20,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isExisting) {
                      onRemoveExisting(index);
                    } else {
                      onRemoveNew(index - existingImages.length);
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
