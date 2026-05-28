"use client";
import { UploadCloud } from "lucide-react";
import { useImageDropzone } from "@/lib/hooks/useImageDropzone";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { env } from "@/lib/config/env";

export interface DropZoneProps {
  multiple?: boolean;
  onAccepted: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function DropZone({ multiple = false, onAccepted, disabled, className }: DropZoneProps) {
  const { t } = useTranslation();
  const { getRootProps, getInputProps, isDragActive } = useImageDropzone({
    onAccept: onAccepted,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
        isDragActive
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud
        className={cn(
          "h-10 w-10 transition-colors",
          isDragActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      <div>
        <p className="font-medium">{t("detect.upload.title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("detect.upload.hint", { maxMb: env.NEXT_PUBLIC_MAX_UPLOAD_MB })}
        </p>
      </div>

      {/* Mobile camera button */}
      <label className="mt-2 cursor-pointer rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 md:hidden">
        צילום מהמצלמה
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) onAccepted(files);
          }}
        />
      </label>
    </div>
  );
}
