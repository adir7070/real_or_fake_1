"use client";
import { useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const MAX_BYTES = 100 * 1024 * 1024;

interface Props {
  onAccepted: (file: File) => void;
  disabled?: boolean;
}

export function VideoDropZone({ onAccepted, disabled }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(file: File): boolean {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("סוג קובץ לא נתמך — MP4, MOV או WebM בלבד");
      return false;
    }
    if (file.size > MAX_BYTES) {
      toast.error("הקובץ גדול מדי — מקסימום 100 מ״ב");
      return false;
    }
    return true;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || disabled) return;
    const file = files[0];
    if (validate(file)) onAccepted(file);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer select-none",
        disabled
          ? "pointer-events-none opacity-50 border-muted"
          : "border-border hover:border-primary hover:bg-accent/30"
      )}
    >
      <div className="text-4xl">🎬</div>
      <p className="text-base font-semibold">{t("video.upload.title")}</p>
      <p className="text-sm text-muted-foreground">{t("video.upload.hint")}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
