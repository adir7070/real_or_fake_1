"use client";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useCallback } from "react";
import { env } from "@/lib/config/env";
import { toast } from "sonner";

interface Args {
  onAccept: (files: File[]) => void;
  multiple?: boolean;
}

export function useImageDropzone({ onAccept, multiple = false }: Args) {
  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      rejections.forEach((r) => {
        const reason = r.errors[0]?.code;
        if (reason === "file-too-large") toast.error("הקובץ גדול מדי");
        else if (reason === "file-invalid-type") toast.error("פורמט לא נתמך");
        else toast.error(r.errors[0]?.message ?? "קובץ נדחה");
      });
      if (accepted.length > 0) onAccept(accepted);
    },
    [onAccept]
  );

  return useDropzone({
    onDrop,
    multiple,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: env.NEXT_PUBLIC_MAX_UPLOAD_MB * 1024 * 1024,
  });
}
